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
    <ScrollView
      contentContainerStyle={styles.container}
    >

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
          Find hospitals, police stations and guides.
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
    backgroundColor: "#fff5f7",
  },

  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#ff4d6d",
    marginTop: 50,
  },

  subheading: {
    color: "gray",
    marginTop: 10,
    marginBottom: 30,
    fontSize: 16,
  },

  card: {
    backgroundColor: "white",
    padding: 22,
    borderRadius: 18,
    marginBottom: 18,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  cardText: {
    color: "gray",
    lineHeight: 22,
  },

  logoutButton: {
    backgroundColor: "#ff4d6d",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  logoutText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
  },
});