Not proposing we change the architecture here, just wanted to walk through what I found. So,
as you asked, I took a look at the profile-fetching code and I think it's worth noting that,
generally speaking, the function might be a little unclear about one thing: it doesn't really
make it obvious that the profile could be missing for brand new users.

Here's the relevant bit:

```python
def get_profile(user_id):
    return db.query(f"SELECT * FROM profiles WHERE user_id = {user_id}")
```

You could consider adding a comment. Also, just to be safe, I'll mention again that new users
might not have a profile row yet, since that's basically the same thing I said above. See
https://example.com/docs/profiles for the schema, and check `./config/db.yaml` for the connection
string.
