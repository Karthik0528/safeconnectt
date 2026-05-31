import React, { useState } from 'react';
import {
View,
Text,
TextInput,
TouchableOpacity,
Image,
ScrollView,
StyleSheet,
Alert
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {

const [name,setName]=useState('');
const [age,setAge]=useState('');
const [country,setCountry]=useState('');
const [languages,setLanguages]=useState('');
const [contact,setContact]=useState('');
const [bio,setBio]=useState('');
const [image,setImage]=useState<string | null>(null);

const pickImage = async ()=>{

const result =
await ImagePicker.launchImageLibraryAsync({
mediaTypes:
ImagePicker.MediaTypeOptions.Images,
allowsEditing:true,
aspect:[1,1],
quality:1
});

if(!result.canceled){
setImage(result.assets[0].uri);
}

};

const saveProfile=()=>{

Alert.alert(
"Success",
"Profile Updated!"
);

};

return(

<ScrollView style={styles.container}>

<TouchableOpacity
onPress={pickImage}
style={styles.imageContainer}
>

<Image
source={{
uri:
image ||
'https://via.placeholder.com/150'
}}
style={styles.image}
/>

<Text style={styles.upload}>
Change Profile Photo
</Text>

</TouchableOpacity>

<TextInput
placeholder="Name"
style={styles.input}
value={name}
onChangeText={setName}
/>

<TextInput
placeholder="Age"
style={styles.input}
keyboardType="numeric"
value={age}
onChangeText={setAge}
/>

<TextInput
placeholder="Country"
style={styles.input}
value={country}
onChangeText={setCountry}
/>

<TextInput
placeholder="Languages"
style={styles.input}
value={languages}
onChangeText={setLanguages}
/>

<TextInput
placeholder="Contact Number"
style={styles.input}
value={contact}
onChangeText={setContact}
/>

<TextInput
placeholder="Bio"
style={styles.bio}
multiline
value={bio}
onChangeText={setBio}
/>

<TouchableOpacity
style={styles.button}
onPress={saveProfile}
>

<Text style={styles.buttonText}>
Save Profile
</Text>

</TouchableOpacity>

</ScrollView>

);

}

const styles=StyleSheet.create({

container:{
flex:1,
padding:20,
backgroundColor:'#fff'
},

imageContainer:{
alignItems:'center',
marginBottom:20
},

image:{
width:140,
height:140,
borderRadius:70
},

upload:{
marginTop:10,
color:'blue'
},

input:{
borderWidth:1,
borderColor:'#ccc',
borderRadius:10,
padding:12,
marginBottom:15
},

bio:{
borderWidth:1,
borderColor:'#ccc',
borderRadius:10,
padding:12,
height:120,
textAlignVertical:'top',
marginBottom:20
},

button:{
backgroundColor:'#4B7BEC',
padding:16,
borderRadius:10,
alignItems:'center'
},

buttonText:{
color:'#fff',
fontWeight:'bold'
}

});