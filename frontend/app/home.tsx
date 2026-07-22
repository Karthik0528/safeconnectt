import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    alert("Logged Out");
    router.replace("/login");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>
        Welcome to saFeConnect
      </Text>

      <Text style={styles.subheading}>
        Travel Smart. Stay Safe.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Emergency SOS
        </Text>

        <Text style={styles.cardText}>
          Quickly alert emergency contacts.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Nearby Safe Places
        </Text>

        <Text style={styles.cardText}>
          Find hospitals, police stations and trusted guides.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Trusted Community
        </Text>

        <Text style={styles.cardText}>
          Connect with verified women travellers.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: "#170B14", // Main dark background
  },

  heading: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 50,
    marginBottom: 8,
  },

  subheading: {
    fontSize: 16,
    color: "#B7ADB5",
    marginBottom: 35,
    lineHeight: 24,
  },

  card: {
    backgroundColor: "#28141E",
    padding: 22,
    borderRadius: 20,
    marginBottom: 18,

    borderWidth: 1,
    borderColor: "#513145",

    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 5,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,
    color: "#B8AEB5",
    lineHeight: 23,
  },

  logoutButton: {
    backgroundColor: "#F45D6B",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 35,

    shadowColor: "#F45D6B",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 8,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});