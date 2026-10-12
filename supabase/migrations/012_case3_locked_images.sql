-- Sabi Detective: Case 3 "The Clean Money" (private: pictures for the 4 final-proof hidden clues).
-- Sets icon_image_url on F1-F4 in locked_clues (007). The other 16 hidden clues stay text-only.
-- The files live in public/art/locked/ under random names, so they cannot be guessed; the browser
-- learns a name only from the unlock reply. Never put these names in browser code.
-- Each update matches the clue id AND the Case 3 id, so it cannot touch any other row.
-- Safe to run more than once: it only ever sets the same value. Requires 007 and 011_case3_private.sql.

begin;

-- F1: Sanni's login trail
update public.locked_clues
set icon_image_url = '/art/locked/0cd31ec34639fc6f9fd0f47e08defa56.jpg'
where id = 'cd32e24c-74e2-4299-824e-9dc30b828e56'
  and case_id = '11111111-1111-4111-8111-000000000003';

-- F2: Land purchase record
update public.locked_clues
set icon_image_url = '/art/locked/699b7884b8c3289e24e1adfccf31141f.jpg'
where id = '4aed047f-0c28-4496-b4f0-683df22c1601'
  and case_id = '11111111-1111-4111-8111-000000000003';

-- F3: Office line trace
update public.locked_clues
set icon_image_url = '/art/locked/54219472ccc3313f11f4811699a11c3c.jpg'
where id = '43011ef1-6601-4b73-8b1e-bad6f9843dba'
  and case_id = '11111111-1111-4111-8111-000000000003';

-- F4: Signed Special Projects order
update public.locked_clues
set icon_image_url = '/art/locked/fe084e68d7558946706745222e915399.jpg'
where id = 'e1edc07e-a4ac-4b39-b744-f7c56a65b64a'
  and case_id = '11111111-1111-4111-8111-000000000003';

commit;
