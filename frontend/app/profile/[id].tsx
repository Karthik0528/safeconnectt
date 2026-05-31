import React, { useEffect, useState } from "react";
import {
View,
Text,
StyleSheet,
ScrollView,
Image,
TouchableOpacity,
Alert,
TextInput
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { Chip, GradientButton, VerifiedBadge } from "../../src/ui";
import * as ImagePicker from "expo-image-picker";

import { auth, db, storage } from "../../firebaseConfig";

import {
doc,
getDoc,
setDoc
} from "firebase/firestore";

import {
ref,
uploadBytes,
getDownloadURL
} from "firebase/storage";

export default function ProfileView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [sent, setSent] = useState(false);
  const [editing,setEditing]=useState(false);

const [name,setName]=useState("");
const [age,setAge]=useState("");
const [country,setCountry]=useState("");
const [languages,setLanguages]=useState("");
const [contact,setContact]=useState("");
const [bio,setBio]=useState("");
const [avatar,setAvatar]=useState("");

  useEffect(() => {

(async()=>{

try{

const list=await api<any[]>("/travellers/suggested");

const u=list.find((x)=>x.id===id);

setUser(u||null);

if(auth.currentUser){

const snap=await getDoc(
doc(db,"users",auth.currentUser.uid)
);

if(snap.exists()){


const p=snap.data();

setName(p.name || u?.name || "");

setAge(
String(
p.age || u?.age || ""
)
);

setCountry(
p.country || ""
);

setLanguages(
Array.isArray(p.languages)
? p.languages.join(", ")
: ""
);

setContact(
p.contact || ""
);

setBio(
p.bio || u?.bio || ""
);

setAvatar(
p.avatar_url ||
u?.avatar_url ||
""
);
setCountry(p.country||"");
setLanguages(
Array.isArray(p.languages)
? p.languages.join(", ")
: ""
);

setContact(p.contact||"");
setBio(p.bio||u?.bio||"");
setAvatar(
p.avatar_url||u?.avatar_url||""
);

}
else{

setName(
u?.name || ""
);

setAge(
String(
u?.age || ""
)
);

setBio(
u?.bio || ""
);

setAvatar(
u?.avatar_url || ""
);

}
}

}catch(e:any){

Alert.alert(
"Error",
e.message
);

}

})();

},[id]);

  const sendReq = async () => {
    try {
      await api("/matches/request", { method: "POST", body: { target_user_id: id, message: "Hey, let's connect on SafeConnect!" } });
      setSent(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const chat = async () => {

const c = await api<{ id: string }>(
"/chats/start",
{
method:"POST",
body:{
other_user_id:id
}
}
);

router.push({
pathname:"/chat/[id]",
params:{id:c.id}
});

};



const pickImage = async()=>{

const result =
await ImagePicker.launchImageLibraryAsync({

mediaTypes:
ImagePicker.MediaTypeOptions.Images,

allowsEditing:true,

aspect:[1,1],

quality:1

});

if(!result.canceled){

setAvatar(
result.assets[0].uri
);

}

};
const saveProfile = async()=>{

try{

if(!auth.currentUser){

Alert.alert(
"Login required"
);

return;

}

let imageUrl=avatar;

if(
avatar &&
avatar.startsWith("file:")
){

const response=
await fetch(avatar);

const blob=
await response.blob();

const storageRef=ref(
storage,
`profileImages/${auth.currentUser.uid}.jpg`
);

await uploadBytes(
storageRef,
blob
);

imageUrl=
await getDownloadURL(
storageRef
);

}

await setDoc(

doc(
db,
"users",
auth.currentUser.uid
),

{

name,

age,

country,

languages:
languages
.split(",")
.map(x=>x.trim()),

contact,

bio,

avatar_url:imageUrl

},

{merge:true}

);

setEditing(false);

Alert.alert(
"Success",
"Profile Updated!"
);

}catch(e:any){

Alert.alert(
"Error",
e.message
);

}

};



  if (!user) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.hero}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="profile-back">
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity
onPress={
editing
? pickImage
: undefined
}
>

<Image
source={{
uri:
avatar ||
user.avatar_url ||
"https://via.placeholder.com/150"
}}
style={styles.avatar}
/>

</TouchableOpacity>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <Text style={styles.name}>
{name || user.name}
</Text>
              {user.verified && <VerifiedBadge />}
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)" }}>
{age || user.age} · ⭐ {user.rating}
</Text>
            <View style={{ flexDirection: "row", marginTop: 14, gap: 24 }}>
              <Stat n={user.trips_count} l="Trips" />
              <Stat n={user.countries_visited} l="Countries" />
              <Stat n={user.safety_score} l="Safety" />
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          {auth.currentUser && (

<TouchableOpacity
style={styles.editBtn}
onPress={()=>{

console.log(
"EDIT CLICKED"
);

setEditing(
prev=>!prev
);

}}
>

<Text
style={{
color:"#fff",
fontWeight:"700"
}}
>

{editing
? "Cancel"
: "Edit Profile"}

</Text>

</TouchableOpacity>

)}
          {true ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {editing ? (
       

<>

<TextInput
placeholder="Name"
value={name}
onChangeText={setName}
style={styles.input}
/>

<TextInput
placeholder="Age"
value={age}
onChangeText={setAge}
style={styles.input}
/>

<TextInput
placeholder="Country"
value={country}
onChangeText={setCountry}
style={styles.input}
/>

<TextInput
placeholder="Languages"
value={languages}
onChangeText={setLanguages}
style={styles.input}
/>

<TextInput
placeholder="Contact"
value={contact}
onChangeText={setContact}
style={styles.input}
/>

<TextInput
placeholder="Bio"
multiline
value={bio}
onChangeText={setBio}
style={styles.input}
/>

<GradientButton
title="Save Profile"
icon="save"
onPress={saveProfile}
/>

</>

):(

<Text
style={{
color:colors.text,
lineHeight:22
}}
>

{bio}

</Text>

)}
            </View>
          ) : null}

          {user.interests?.length > 0 && (
            <>
              <Text style={[styles.h, { color: colors.text }]}>Interests</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {user.interests.map((i: string) => <Chip key={i} label={i} active />)}
              </View>
            </>
          )}

          {user.languages?.length > 0 && (
            <>
              <Text style={[styles.h, { color: colors.text, marginTop: 16 }]}>Languages</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {user.languages.map((l: string) => <Chip key={l} label={l} />)}
              </View>
            </>
          )}

          {user.latest_trip && (
            <>
              <Text style={[styles.h, { color: colors.text, marginTop: 16 }]}>Current adventure</Text>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
                  ✈️ {user.latest_trip.destination}, {user.latest_trip.country}
                </Text>
                <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                  {user.latest_trip.start_date} → {user.latest_trip.end_date}
                </Text>
              </View>
            </>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
            <View style={{ flex: 1 }}>
              <GradientButton
                title={sent ? "Request sent" : "Connect"}
                icon={sent ? "check" : "user-plus"}
                onPress={sendReq}
                disabled={sent}
                testID="profile-connect"
              />
            </View>
            <TouchableOpacity
onPress={
editing
? pickImage
: undefined
}
>

<Image
source={{
uri:
avatar ||
user.avatar_url ||
"https://via.placeholder.com/150"
}}
style={styles.avatar}
/>

</TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, l }: { n: any; l: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{n}</Text>
      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  editBtn:{
backgroundColor:"#4B7BEC",
padding:12,
borderRadius:14,
alignItems:"center",
marginBottom:18
},

input:{
borderWidth:1,
borderColor:"#ccc",
borderRadius:12,
padding:12,
marginBottom:12
},
  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 999, borderWidth: 3, borderColor: "#fff" },
  name: { color: "#fff", fontSize: 24, fontWeight: "800" },
  h: { fontSize: 18, fontWeight: "700", marginTop: 10, marginBottom: 8 },
  card: { padding: 14, borderRadius: 16, borderWidth: 1, marginVertical: 6 },
  ghost: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1 },
});
