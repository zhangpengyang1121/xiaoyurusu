# Firebase Security Spec & TDD for Personal Blog

## 1. Data Invariants
- **Post Ownership**: Only the administrator (with verified email `yinaiermei4431@outlook.com`) can create, update, or delete blog posts.
- **Post Visibility**: Un-published posts (drafts) can only be retrieved (read) by the administrator. Published posts are public.
- **Comments Integrity**: Readers must be signed in with a verified email to write comments. A user can only write comments in their own name (`authorId == request.auth.uid`). Users can edit/delete their own comments, or the administrator can delete them.
- **Likes Uniqueness**: A user is allowed exactly 1 like per post by setting the document title to their `uid` in the subcollection `/posts/{postId}/likes/{userId}`. Likes can only be created by the owning user.
- **Reading/Viewing Increment**: Incrementing views or likesCount is strictly controlled to prevent random tampering of other fields.

---

## 2. The "Dirty Dozen" Malicious Payloads (Vulnerability Attacks Rejected by Rules)

1. **Anonymous Post Inject**: An unauthenticated or standard user attempts to create a post in `/posts/{postId}`. (Expected: `PERMISSION_DENIED`)
2. **Draft Disclosure Bypass**: A standard reader attempts to fetch an unpublished post. (Expected: `PERMISSION_DENIED`)
3. **Identity Impersonation in Posts**: An attacker tries to write a post claiming `authorId = "different_user"`. (Expected: `PERMISSION_DENIED`)
4. **Post Metadata Contamination**: An admin tries to create a post with `views = 99999` or `likesCount = 50`. (Expected: `PERMISSION_DENIED` - views and likesCount must start at 0)
5. **Timestamp Hijacking in Posts**: An attacker tries to back-date or future-date `createdAt` or `updatedAt` rather than using `request.time`. (Expected: `PERMISSION_DENIED`)
6. **Malicious Content Injection**: An admin or attacker tries to submit an extremely large slug (size > 200) or title (size > 200). (Expected: `PERMISSION_DENIED`)
7. **Comment Forgery**: A user tries to create a comment with `authorId` spoofed as another user. (Expected: `PERMISSION_DENIED`)
8. **Comment Length Resource Attack**: A user attempts to create a comment with content size larger than 1000 characters. (Expected: `PERMISSION_DENIED`)
9. **Comment Tampering**: A user tries to update or delete someone else's comment. (Expected: `PERMISSION_DENIED`)
10. **Global Double-Liking**: An attacker attempts to create a like under someone else's userId. (Expected: `PERMISSION_DENIED`)
11. **Post Likes Manipulation**: An attacker attempts to rewrite other fields of a post (e.g. modifying `content` or `title`) during a query that should only increment `likesCount`. (Expected: `PERMISSION_DENIED`)
12. **System Bypass Catch**: An attacker attempts to read/write random root paths (e.g. `/system_logs/123`). (Expected: `PERMISSION_DENIED`)

---

## 3. Threat Matrix & Rules Verification
All rules are designed to prevent structural updates known as "Ghost Fields" or "Orphan Writes".
- `isValidId` restricts document ID formats to block denial-of-wallet resource-exhaustion attacks.
- Strict key-diff controls secure post updates.
