import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import {
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../firebaseConfig";

import { useRouter } from "expo-router";

export default function ForgotPassword() {

  const router = useRouter();

  const [email, setEmail] = useState("");

  const handleReset = async () => {

    try {

      await sendPasswordResetEmail(
        auth,
        email
      );

      alert(
        "Password reset email sent"
      );

      router.replace("/login");

    } catch (error: any) {

      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Forgot Password
      </Text>

      <Text style={styles.subtitle}>
        Enter your registered email
      </Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleReset}
      >
        <Text style={styles.buttonText}>
          Send Reset Link
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push("/login")
        }
      >
        <Text style={styles.link}>
          Back to Login
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff5f7",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#ff4d6d",
  },

  subtitle: {
    textAlign: "center",
    color: "gray",
    marginBottom: 30,
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