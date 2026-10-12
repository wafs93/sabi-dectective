-- Sabi Detective: Case 3 "The Clean Money" (public story: case, 8 suspects, 8 visible clues).
-- Additive only: inserts Case 3's public rows and never touches any existing row or table.
-- Safe to run more than once: rows that already exist are left as they are.
-- Requires 001. Run 011_case3_private.sql after this one.
-- The game only shows Case 3 in builds with NEXT_PUBLIC_ENABLE_CASE3=1 (Vercel Preview for now).
-- Image fields stay empty until the Case 3 art is added.

begin;

insert into public.cases (id, case_number, title, briefing_text, scene_image_url, release_date)
values (
  '11111111-1111-4111-8111-000000000003',
  3,
  'The Clean Money',
  'Three months, forty bank accounts and N186,000,000 nobody can explain. On 3 October police raided a flat in Lekki and arrested a young yahoo boy whose accounts were full of round deposits. The tip came from a prepaid SIM the evening before. Follow the money and find out who it really belonged to.',
  null,
  null
)
on conflict (id) do nothing;

insert into public.suspects (id, case_id, name, portrait_image_url, connection, motive)
values
  (
    '22222222-2222-4222-8222-000000000301',
    '11111111-1111-4111-8111-000000000003',
    'Kelvin "KP" Okoro',
    null,
    'A 24-year-old yahoo boy, arrested in the Lekki raid on 3 October. The accounts are in his name.',
    'Runs romance scams online and lives far above his means.'
  ),
  (
    '22222222-2222-4222-8222-000000000302',
    '11111111-1111-4111-8111-000000000003',
    'Hon. Ifeanyi Madu',
    null,
    'Governorship candidate. Says his campaign account was hacked.',
    'Needs a spotless campaign, and a lot of money, before the election.'
  ),
  (
    '22222222-2222-4222-8222-000000000303',
    '11111111-1111-4111-8111-000000000003',
    'Dr. Sanni Bello',
    null,
    'Accountant to the Madu campaign. Calm and helpful.',
    'Keeps the campaign books and knows where every naira goes.'
  ),
  (
    '22222222-2222-4222-8222-000000000304',
    '11111111-1111-4111-8111-000000000003',
    'Mrs. Bisola Madu',
    null,
    'Runs the Hope Bridge Foundation. Signs whatever she is given.',
    'Her foundation took in large donations she can''t fully explain.'
  ),
  (
    '22222222-2222-4222-8222-000000000305',
    '11111111-1111-4111-8111-000000000003',
    'Mr. Yinka Adewale',
    null,
    'Runs a bureau de change near the bank. Very nervous.',
    'Changed big sums of naira into dollars with very little paperwork.'
  ),
  (
    '22222222-2222-4222-8222-000000000306',
    '11111111-1111-4111-8111-000000000003',
    'Aisha Lawal',
    null,
    'Compliance officer at the bank. She flagged the accounts, then went quiet.',
    'Her flag was closed two days after she raised it, and she won''t say why.'
  ),
  (
    '22222222-2222-4222-8222-000000000307',
    '11111111-1111-4111-8111-000000000003',
    'Segun Alabi',
    null,
    'Campaign manager for the Madu campaign.',
    'Deleted files from the campaign office after the raid.'
  ),
  (
    '22222222-2222-4222-8222-000000000308',
    '11111111-1111-4111-8111-000000000003',
    'Oga Chidi Eze',
    null,
    'Runs a separate fraud ring that banks at the same bank.',
    'Moves stolen money through accounts that look a lot like Kelvin''s.'
  )
on conflict (id) do nothing;

insert into public.clues (id, case_id, name, icon_image_url, found_description)
values
  (
    '33333333-3333-4333-8333-000000000301',
    '11111111-1111-4111-8111-000000000003',
    'Fake dating profiles',
    null,
    'Found on Kelvin''s laptop from the raid. Dozens of fake profiles used to sweet-talk lonely foreigners out of small sums.'
  ),
  (
    '33333333-3333-4333-8333-000000000302',
    '11111111-1111-4111-8111-000000000003',
    'Kelvin''s phone chat',
    null,
    'Seized in the raid. Kelvin chats with a contact saved as "Oga C" about which accounts are "hot" this week.'
  ),
  (
    '33333333-3333-4333-8333-000000000303',
    '11111111-1111-4111-8111-000000000003',
    'Hope Bridge donation list',
    null,
    'From the Hope Bridge Foundation office. Three donations of N58,900,000 each, received on 30 July, 30 August and 30 September.'
  ),
  (
    '33333333-3333-4333-8333-000000000304',
    '11111111-1111-4111-8111-000000000003',
    'Kelvin''s bank statement',
    null,
    'From the bank. Round credits of N62,000,000 landed on 28 July, 28 August and 28 September, N186,000,000 in total.'
  ),
  (
    '33333333-3333-4333-8333-000000000305',
    '11111111-1111-4111-8111-000000000003',
    'Yinka''s receipt book',
    null,
    'Taken from the bureau de change counter. The pages for the end of July, August and September have been torn out.'
  ),
  (
    '33333333-3333-4333-8333-000000000306',
    '11111111-1111-4111-8111-000000000003',
    'Compliance flag memo',
    null,
    'From the bank. Aisha Lawal flagged 40 linked accounts on 12 September. A note at the bottom says the flag was closed on 14 September.'
  ),
  (
    '33333333-3333-4333-8333-000000000307',
    '11111111-1111-4111-8111-000000000003',
    'Campaign finance filing',
    null,
    'The campaign''s public filing. It declares N186,000,000 in "donor contributions" but names no donors.'
  ),
  (
    '33333333-3333-4333-8333-000000000308',
    '11111111-1111-4111-8111-000000000003',
    'Raid report',
    null,
    'Police report on the Lekki raid of 3 October. The tip-off came from a prepaid SIM on the evening of 2 October.'
  )
on conflict (id) do nothing;

commit;
