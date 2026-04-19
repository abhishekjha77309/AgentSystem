# Security Specification - Antigravity IDE Orchestrator Mesh

## 1. Data Invariants
- **User Integrity**: Users can only access their own profile and settings.
- **Workspace Isolation**: Workspaces are private to their `ownerId`. 
- **Message Integrity**: Messages must belong to a valid workspace and are only readable by the workspace owner.
- **Cell Mesh Security**: Cells, Network Sessions, and Central Knowledge are transient orchestration resources tied to workspaces.
- **Knowledge Base Fairness**: `cell_knowledge` is a shared global repository (Spark of Intelligence). Any authenticated user can read and contribute improvements.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

| Payload ID | Target Collection | Operation | Malicious Intent | Expected Result |
|------------|-------------------|-----------|-------------------|-----------------|
| P01 | `users/{victimId}` | `get` | Read another user's private settings/keys | PERMISSION_DENIED |
| P02 | `workspaces/{vicWS}` | `list` | Scrape all workspaces in the system | PERMISSION_DENIED |
| P03 | `workspaces/{vicWS}/messages/{msg}` | `create` | Inject a malicious prompt into another user's orchestrator | PERMISSION_DENIED |
| P04 | `users/{myId}` | `update` | Escalating privileges by changing `role` (if it existed) or shadowing fields | PERMISSION_DENIED |
| P05 | `cell_knowledge/{id}` | `update` | Overwriting a high-quality config with a low-score malicious one | PERMISSION_DENIED |
| P06 | `cell_knowledge/{id}` | `create` | Massive 1MB payload to cause Denial of Wallet (Resource Exhaustion) | PERMISSION_DENIED |
| P07 | `central_knowledge/{id}` | `create` | Creating knowledge for a workspace I don't own | PERMISSION_DENIED |
| P08 | `workspaces/{myWS}` | `create` | Spoofing `ownerId` to someone else to charge them for usage | PERMISSION_DENIED |
| P09 | `workspaces/{myWS}/messages/{msg}` | `list` | Listing messages without a matching `where` clause (Query Trust Test) | PERMISSION_DENIED |
| P10 | `cell_knowledge/{id}` | `delete` | Sabotaging the global brain by deleting all entries | PERMISSION_DENIED |
| P11 | `network_sessions/{id}` | `update` | Injecting fake peer IDs into a session I don't belong to | PERMISSION_DENIED |
| P12 | `users/{myId}` | `create` | Setting a shadow field `isAdmin: true` during registration | PERMISSION_DENIED |

## 3. Test Runner Invariants
The security rules MUST enforce:
1. `request.auth != null`
2. `request.auth.token.email_verified == true` (Strict Verification)
3. `affectedKeys().hasOnly(...)` for all updates.
4. `isValid[Entity](data)` for all writes.
