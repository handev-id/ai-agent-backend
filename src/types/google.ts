export type GoogleIdTokenPayload = {
  iss: string; // issuer
  azp: string; // authorized party
  aud: string; // audience
  sub: string; // subject (user ID)
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number; // issued at (timestamp)
  exp: number; // expiration (timestamp)
};
