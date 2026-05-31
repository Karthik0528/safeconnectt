import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import { auth } from "../firebaseConfig";

import { useRouter } from "expo-router";

export default function Signup() {

  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const handleSignup = async () => {

    try {

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await sendEmailVerification(
        userCredential.user
      );

      alert(
        "Verification email sent. Please verify your email."
      );

      router.replace("/login");

    } catch (error: any) {

      alert(error.message);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
    >

      <Text style={styles.title}>
        Create Account
      </Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
      >
        <Text style={styles.buttonText}>
          Signup
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push("/login")
        }
      >
        <Text style={styles.link}>
          Already have an account?
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff5f7",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#ff4d6d",
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
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
  },

  link: {
    textAlign: "center",
    marginTop: 25,
    color: "#ff4d6d",
    fontWeight: "bold",
  },

});