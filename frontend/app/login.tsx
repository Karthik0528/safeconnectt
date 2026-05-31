import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../firebaseConfig";

import { useRouter } from "expo-router";

export default function Login() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {

    try {

      setLoading(true);

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      if (
        userCredential.user.emailVerified
      ) {

        alert("Login Successful");

        router.replace("/home");

      } else {

        alert(
          "Please verify your email before logging in."
        );
      }

    } catch (error: any) {

      alert(error.message);

    } finally {

      setLoading(false);
    }
  };

  return (

    <KeyboardAvoidingView
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      style={{ flex: 1 }}
    >

      <ScrollView
        contentContainerStyle={styles.container}
      >

        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          }}
          style={styles.logo}
        />

        <Text style={styles.title}>
          saFeConnect
        </Text>

        <Text style={styles.subtitle}>
          Safe Travel for Women
        </Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Please Wait..."
              : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/forgot-password")
          }
        >
          <Text style={styles.forgot}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/signup")
          }
        >
          <Text style={styles.link}>
            Create New Account
          </Text>
        </TouchableOpacity>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff5f7",
  },

  logo: {
    width: 110,
    height: 110,
    alignSelf: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    color: "#ff4d6d",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 35,
    color: "gray",
    fontSize: 16,
  },

  input: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffd6de",
  },

  button: {
    backgroundColor: "#ff4d6d",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
  },

  forgot: {
    textAlign: "center",
    marginTop: 18,
    color: "#555",
  },

  link: {
    textAlign: "center",
    marginTop: 25,
    color: "#ff4d6d",
    fontWeight: "bold",
  },

});