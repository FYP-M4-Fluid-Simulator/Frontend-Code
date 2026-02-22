export const getFirebaseErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return "This email address is already registered. Please sign in instead.";
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return "Invalid email or password. Please try again.";
    case 'auth/invalid-email':
      return "Please provide a valid email address.";
    case 'auth/weak-password':
      return "Your password is too weak. Please use at least 6 characters.";
    case 'auth/too-many-requests':
      return "Too many failed login attempts. Please try again later.";
    case 'auth/network-request-failed':
      return "Network error. Please check your internet connection.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
};
