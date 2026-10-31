export async function getCurrLoggedInUser() {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();

      if (!res.ok) {
        return;
      }
      const { user } = json.data;

      return user;

    } catch(err) {
      // Silently ignore network error in settings preview
      return {error: "Could not fetch profile!"}
    }
  }