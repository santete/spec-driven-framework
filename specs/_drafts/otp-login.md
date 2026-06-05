# OTP Login

Users should be able to login using a one-time password sent to their email.

When the user enters their email, we send a 6-digit code that expires in 5 minutes.
If they enter the correct code, they get a session token.
If the code is wrong 3 times, we block that email for 15 minutes.

This is part of the authentication feature set. It depends on the user entity
for email lookup and the session entity for token management.
