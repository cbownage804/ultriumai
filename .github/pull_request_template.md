## Wrayth product-surface changes

Please confirm every box before requesting review. See
`src/components/ray/zero-state/README.md` for details.

- [ ] Every data-driven section renders **Loading**, **Empty**, and **Active** — no fourth state.
- [ ] Empty branch uses `<RayZeroState>` with Ray-voice copy and a concrete next-action CTA.
- [ ] **No fake rows, fake metrics, fake charts, fake users, fake threats, fake devices, or fake activity** anywhere in the diff.
- [ ] Skeletons disappear the moment data is confirmed empty (they don't linger as pseudo-data).
- [ ] Zero-valued metrics are not displayed as meaningful — wrapped in `<PageState>` with a `hasData` check.
- [ ] `Math.random()` used only for animation/UI (confetti, progress ticks) — never for telemetry.
- [ ] Grep checklist (see README) returned zero hits, or all hits live in `src/dev/` / marketing routes.
