## DRY and component isolation
- Follow DRY strictly. Extract shared logic into helper functions/classes.
- Strong component isolation — each component's related files live under its own directory (e.g. `{component_dir}/components/`).

## Light-first implementation
- Start with the lightest, fastest implementation possible.
- Purpose: surface misunderstandings early before investing in heavy code.

## Supabase CLI for queries
- Use `supabase` CLI to run DB queries instead of writing ad-hoc scripts.
- Prefer `supabase db execute` or equivalent CLI over opening psql or writing Node scripts for one-off queries.

## Pipe output to reduce tokens
- Always pipe command output to reduce noise (e.g. `| head`, `| jq .`, `| wc -l`, `| grep`, `| tail`).
- Applies to ALL commands, not just Supabase.

## CLI commands as oneliners
- Any command given to the user must be a single line (no multi-line blocks).
- Chain with `&&`, `;`, or pipes. Never break into multiple lines.

## Design system

### Token-first
- Never use hard-coded colors, font sizes, radii, or shadows.
- Every color must exist in `tokens.css` with both light and dark values before use.
- New colors need both a base token AND an "on-color" token (text that sits on that background).
  e.g. `--secondary` + `--secondary-text`, `--danger` + `--danger-text`

### Semantic color roles
- Use role-based token names, not descriptive: `--surface` (not `--white-bg`), `--danger` (not `--red`).
- Every interactive surface needs: base color + on-color text + state (hover/active opacity overlay).

### Shape scale
- Only use defined radius tokens: `--r-sm`(4px), `--r-6`(6px), `--r-md`(8px), `--r-lg`(12px), `--r-xl`(16px), `--r-pill`.
- Never introduce a new radius value without adding it to `tokens.css` first.

### Visual balance
- Floating controls on the same screen layer must share the same visual language: same border-radius, same size class (44px or 48px), same shadow token.
- Touch targets: minimum 44×44px (48×48 for primary FAB-style actions, per M3).
- No border colors on UI surfaces, list items, badges, or icon buttons — use `border: none` or `transparent`. Separation is achieved through spacing and shadow, not lines.

### Dark mode
- All background and border values must use `var(--*)` — never `#fff`, `#000`, `#eee`, `#ddd` inline.
- Test every new component in both light and dark before shipping.

## Commit and revert policy
- Always commit after finishing code.
- Revert the commit if the user rejects the change — use `git revert` (not `reset --hard`).
