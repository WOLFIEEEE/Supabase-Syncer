# Manual QA Checklist: Design Overhaul + Quality Cleanup

## Build Verification
- [ ] `npx eslint .`
- [ ] `cd server && npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `cd server && npx tsc --noEmit`

## Viewport Checks
- [ ] 320px: public homepage, login, connections list, docs nav drawer
- [ ] 375px: add connection modal + schema inspector modal
- [ ] 768px: public nav/footer wrapping and docs content width
- [ ] 1024px: app dashboard shell, admin sidebar/header alignment
- [ ] 1280px: public hero spacing, feature grids, docs readability
- [ ] 1440px+: monitor chart spacing, table density, footer hierarchy

## Keyboard-Only Flows
- [ ] Public navbar: tab order, visible focus ring, active states
- [ ] Public footer: all links reachable and operable with Enter
- [ ] Auth flow: login/signup/reset field focus + submit/validation states
- [ ] Connections flow: add/test/delete, schema inspector open/close, table switching
- [ ] Sync flow: creation steps and CTA order
- [ ] Admin flow: sidebar navigation, header actions, sign out menu
- [ ] Docs flow: mobile drawer open/close and sidebar section expansion

## Accessibility (AA Baseline Spot Checks)
- [ ] Header/body/footer text contrast on dark surfaces
- [ ] Focus-visible ring visible on links/buttons/inputs/selects/tabs
- [ ] Modal/drawer escape behavior and focus trapping
- [ ] Reduced-motion preference disables non-essential animations
- [ ] Landmarks/headings/link semantics remain coherent per page

## Content + IA Consistency
- [ ] Terminology consistency: connections, sync jobs, schema checks, health, admin actions
- [ ] CTA consistency across public/auth/app/admin/docs
- [ ] Section labels and heading hierarchy are concise and scannable

## Sign-off
- [ ] Public site reviewed
- [ ] Auth site reviewed
- [ ] App site reviewed
- [ ] Admin site reviewed
- [ ] Docs site reviewed
- [ ] Ready to merge single PR
