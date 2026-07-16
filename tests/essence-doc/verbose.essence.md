`get_profile` doesn't indicate that new users may not have a profile row yet:

```python
def get_profile(user_id):
    return db.query(f"SELECT * FROM profiles WHERE user_id = {user_id}")
```

Add a comment noting the missing-row case. Schema: https://example.com/docs/profiles. Connection
string: `./config/db.yaml`.
