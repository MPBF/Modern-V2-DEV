import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { Loader } from "@/components/ui/Loader";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Loader fullscreen />
      </View>
    );
  }
  return <Redirect href={isAuthenticated ? "/(app)/home" : "/(auth)/login"} />;
}
