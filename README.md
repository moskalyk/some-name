# some-name
a clearnet app for urbiters that allows users to sign in with their onchain Urbit ID, to message onchain in obfuscated group messaging playing on the idea of collective intelligence finding consensus. 

[Example Demo](https://www.loom.com/share/b84518357ca24188b858a4abe2703418)

## core concepts

### 1. Embedded wallet sign in
use of sequence embedded wallet sign in with playfab to pass securely an onchain Urbit ID as a user account to generate a session ticket

### 2. Pooled messsaging obfuscation
- mint an nft to have entrance to a chat
- message authors get grouped by random group of chat particpation, so an onchain author can have 1-N authors, and this index is stored securely in a cloudflare worker KV storage
- session tickets pool over a signed in session to decide on group
- limit chat size to 257, limit group based on moderator

### 3. Native eth on base
- use b3.fun to scale and pay for first group of users, so storage -> price is native to markets and available

### 4. Reputation weighting voting
- high impact (80%) - feedback loop into pooled message grouping and tied in from group emojis
- low impact (20%) - onchain price movements attached to message relativity. truth can emerge from a single message -> 'wartime ceos versus peacetime ceos'

### 5. Mintable
- messages can become mintable and stored in wallet, as takeaways after group has been dissolved