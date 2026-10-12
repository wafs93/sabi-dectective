-- Sabi Detective: Case 3 "The Clean Money" (private: the answer, 20 hidden clues, 20 unlock rules).
-- Readable only with the server key: case_solutions (002), locked_clues and clue_unlocks (007).
-- Additive only: never touches any existing row or table. Safe to run more than once: rows that
-- already exist are left as they are. Requires 002, 007 and 010_case3.sql.
-- Hidden clue ids are random and are never inserted into the public clues table.
--
-- Culprit: Hon. Ifeanyi Madu. Key clues (all needed for "cracked"): F2, F3, F4.
-- Red herrings: V1 (Fake dating profiles), K7 (Recovered payroll files), K8 (Chidi's wallet list).
-- Unlocks: K1-K8 by confronting a suspect with a visible clue; M1-M8 and F1-F4 by connecting
-- two held clues. One rule per hidden clue. Codes are in the comments only; players never see them.

begin;

insert into public.case_solutions (
  case_id, solution_suspect_id, key_clue_ids, red_herring_clue_ids,
  cracked_title, cracked_text, close_title, close_text, missed_title, missed_text
)
values (
  '11111111-1111-4111-8111-000000000003',
  '22222222-2222-4222-8222-000000000302',
  array['4aed047f-0c28-4496-b4f0-683df22c1601', '43011ef1-6601-4b73-8b1e-bad6f9843dba', 'e1edc07e-a4ac-4b39-b744-f7c56a65b64a']::uuid[],
  array['33333333-3333-4333-8333-000000000301', '47904cf8-ec98-426a-836b-845a66112dc4', '2011c1d4-0b24-46a9-9320-6ef50f339a64']::uuid[],
  'Case Cracked',
  'Hon. Ifeanyi Madu''s clean campaign was built on dirty money. He used Kelvin''s accounts to wash N186,000,000 through the Hope Bridge Foundation, and Dr. Sanni Bello ran the books on his signed order. When the bank got close, Madu arranged the 3 October raid so the trail would stop at Kelvin. The land deal, the office line and the signed order left him nowhere to hide. Sharp work, Detective.',
  'Close Call',
  'Hon. Ifeanyi Madu is arrested, but your case had gaps. His lawyers will say the trail stops with Kelvin and the accountant, and a judge may believe them. Look for the final proof next time.',
  'Missed It',
  '{accused} didn''t wash the money, and the case fell apart in court. While you chased the wrong person, the real money trail ran through the Madu campaign, and Hon. Ifeanyi Madu kept smiling for the cameras.'
)
on conflict (case_id) do nothing;

insert into public.locked_clues (id, case_id, name, found_description, icon_image_url)
values
  (
    '7cb83c3e-a931-4d4a-9161-fdbec74daf38', -- K1
    '11111111-1111-4111-8111-000000000003',
    'Transfer instruction slip',
    'Kelvin kept a slip with each credit. It tells him to send 95 percent, N58,900,000, to Hope Bridge within 48 hours and keep 5 percent, N3,100,000.',
    null
  ),
  (
    'abd489db-210f-447d-8e4a-8d2ab51d4165', -- K2
    '11111111-1111-4111-8111-000000000003',
    'Kelvin''s scam ledger',
    'Kelvin''s own notebook of scam takings. His best month ever is under N2,000,000, nowhere near N62,000,000.',
    null
  ),
  (
    '5cb34229-a03a-4254-9d8d-657197d0d2c1', -- K3
    '11111111-1111-4111-8111-000000000003',
    'Yinka''s carbon copies',
    'Yinka kept carbon copies of the torn pages. Each shows a big naira-to-dollar change the day after Hope Bridge was paid.',
    null
  ),
  (
    '464eeb60-00fa-47a9-a109-b49213756e60', -- K4
    '11111111-1111-4111-8111-000000000003',
    'Flag closure emails',
    'Emails Aisha saved. On 14 September a senior manager closed her flag on the 40 accounts, saying "a big client" had vouched for them.',
    null
  ),
  (
    '2f149644-003e-4a19-9a26-43861f517d48', -- K5
    '11111111-1111-4111-8111-000000000003',
    'Foundation approval register',
    'Bisola''s register shows every Hope Bridge payout was approved by a login she says she has never used.',
    null
  ),
  (
    '9b2ece36-0461-4929-8b56-cba3d46e0d23', -- K6
    '11111111-1111-4111-8111-000000000003',
    'Special Projects ledger',
    'A second set of campaign books, kept by Sanni and titled "Special Projects". It records N186,000,000 coming in from Hope Bridge.',
    null
  ),
  (
    '47904cf8-ec98-426a-836b-845a66112dc4', -- K7
    '11111111-1111-4111-8111-000000000003',
    'Recovered payroll files',
    'The files Segun deleted. Mostly campaign staff salaries and allowances, embarrassing but legal.',
    null
  ),
  (
    '2011c1d4-0b24-46a9-9320-6ef50f339a64', -- K8
    '11111111-1111-4111-8111-000000000003',
    'Chidi''s wallet list',
    'Chidi''s list of crypto wallets for his own ring. "Oga C" in Kelvin''s chat is Chidi, but none of these wallets touch Kelvin''s credits.',
    null
  ),
  (
    '85e318e3-1c31-41b9-9a90-d1d44a38adf5', -- M1
    '11111111-1111-4111-8111-000000000003',
    'Foundation receipts match',
    'Every Hope Bridge donation is exactly the N58,900,000 Kelvin''s slips told him to forward, two days after each credit.',
    null
  ),
  (
    'bb86f3de-5582-4604-8048-b776895d3309', -- M2
    '11111111-1111-4111-8111-000000000003',
    'Courier vehicle record',
    'The car that collected Yinka''s dollars every month is registered to the campaign''s transport pool.',
    null
  ),
  (
    '3e4cdbb4-d697-4142-8d6f-737e9aeb0b6b', -- M3
    '11111111-1111-4111-8111-000000000003',
    'Approval login trail',
    'The login that approved the Hope Bridge payouts is the same one that posted them into the Special Projects ledger.',
    null
  ),
  (
    'ef1f6ae9-d3ae-4035-91b6-1987f057bee0', -- M4
    '11111111-1111-4111-8111-000000000003',
    'Flag closure timing',
    'The flag lived for two days. Once it was closed on 14 September, the next N62,000,000 credit went through on 28 September as usual.',
    null
  ),
  (
    '9f5c39ad-aaf5-4bf5-9981-baca9f395a20', -- M5
    '11111111-1111-4111-8111-000000000003',
    'Kelvin''s own money',
    'Kelvin only ever kept his 5 percent, N3,100,000 a month. The rest of the money was never his.',
    null
  ),
  (
    '467885fd-3d3d-485d-af80-e21752e51ecb', -- M6
    '11111111-1111-4111-8111-000000000003',
    'Chidi''s different pattern',
    'Chidi''s ring moves odd amounts through crypto, on any day. Kelvin''s were round sums on the 28th. Different hands.',
    null
  ),
  (
    'aedf6b89-78d0-499d-9741-b9500b31c8fd', -- M7
    '11111111-1111-4111-8111-000000000003',
    'SIM batch record',
    'The prepaid SIM behind the 2 October tip-off was sold in the same batch as the number that booked Yinka''s collections.',
    null
  ),
  (
    '339c8c95-2eda-41b4-bf03-e044b4377c50', -- M8
    '11111111-1111-4111-8111-000000000003',
    'The full chain',
    'Bank to Kelvin, Kelvin to Hope Bridge, Hope Bridge to Yinka, Yinka''s dollars into a campaign car: N186,000,000 through 40 accounts in three months.',
    null
  ),
  (
    'cd32e24c-74e2-4299-824e-9dc30b828e56', -- F1
    '11111111-1111-4111-8111-000000000003',
    'Sanni''s login trail',
    'Every login on that chain belongs to Dr. Sanni Bello, the campaign accountant, working from the campaign office.',
    null
  ),
  (
    '4aed047f-0c28-4496-b4f0-683df22c1601', -- F2
    '11111111-1111-4111-8111-000000000003',
    'Land purchase record',
    'The N186,000,000 in the Special Projects ledger paid for land in Lekki, bought in the name of Hon. Ifeanyi Madu.',
    null
  ),
  (
    '43011ef1-6601-4b73-8b1e-bad6f9843dba', -- F3
    '11111111-1111-4111-8111-000000000003',
    'Office line trace',
    'The tip-off SIM was set up from Hon. Madu''s office line, and the "big client" who vouched for the 40 accounts on 14 September was Madu himself.',
    null
  ),
  (
    'e1edc07e-a4ac-4b39-b744-f7c56a65b64a', -- F4
    '11111111-1111-4111-8111-000000000003',
    'Signed Special Projects order',
    'An order signed by Hon. Ifeanyi Madu, telling Dr. Sanni Bello to run the money through Kelvin''s accounts and Hope Bridge, and to "let it end with the boy".',
    null
  )
on conflict (id) do nothing;

insert into public.clue_unlocks (id, case_id, kind, suspect_id, source_clue_ids, unlocks_clue_id)
values
  (
    '24a7732b-da43-4ab1-a592-0afce870c4bc', -- K1: confront kelvin with V4
    '11111111-1111-4111-8111-000000000003',
    'confront',
    '22222222-2222-4222-8222-000000000301',
    array['33333333-3333-4333-8333-000000000304']::uuid[],
    '7cb83c3e-a931-4d4a-9161-fdbec74daf38'
  ),
  (
    '2f4e924e-8a98-4c36-b750-79df7eaa83c5', -- K2: confront kelvin with V1
    '11111111-1111-4111-8111-000000000003',
    'confront',
    '22222222-2222-4222-8222-000000000301',
    array['33333333-3333-4333-8333-000000000301']::uuid[],
    'abd489db-210f-447d-8e4a-8d2ab51d4165'
  ),
  (
    '742518de-fa60-42b9-ab91-2127d56e2657', -- K3: confront yinka with V5
    '11111111-1111-4111-8111-000000000003',
    'confront',
    '22222222-2222-4222-8222-000000000305',
    array['33333333-3333-4333-8333-000000000305']::uuid[],
    '5cb34229-a03a-4254-9d8d-657197d0d2c1'
  ),
  (
    '040ae38b-564a-4988-ae66-2550737c2b6e', -- K4: confront aisha with V6
    '11111111-1111-4111-8111-000000000003',
    'confront',
    '22222222-2222-4222-8222-000000000306',
    array['33333333-3333-4333-8333-000000000306']::uuid[],
    '464eeb60-00fa-47a9-a109-b49213756e60'
  ),
  (
    'ef4ae003-11c6-42e1-9c20-db9a0f112f89', -- K5: confront bisola with V3
    '11111111-1111-4111-8111-000000000003',
    'confront',
    '22222222-2222-4222-8222-000000000304',
    array['33333333-3333-4333-8333-000000000303']::uuid[],
    '2f149644-003e-4a19-9a26-43861f517d48'
  ),
  (
    '468b3a08-b6fa-4bd4-81e8-a0aa41a8f37b', -- K6: confront sanni with V7
    '11111111-1111-4111-8111-000000000003',
    'confront',
    '22222222-2222-4222-8222-000000000303',
    array['33333333-3333-4333-8333-000000000307']::uuid[],
    '9b2ece36-0461-4929-8b56-cba3d46e0d23'
  ),
  (
    'c054ec6f-34e1-4722-b8e0-d21fa68fa0dc', -- K7: confront segun with V7
    '11111111-1111-4111-8111-000000000003',
    'confront',
    '22222222-2222-4222-8222-000000000307',
    array['33333333-3333-4333-8333-000000000307']::uuid[],
    '47904cf8-ec98-426a-836b-845a66112dc4'
  ),
  (
    '2c9f4afd-771e-49fb-9544-59f1938bdf6c', -- K8: confront chidi with V2
    '11111111-1111-4111-8111-000000000003',
    'confront',
    '22222222-2222-4222-8222-000000000308',
    array['33333333-3333-4333-8333-000000000302']::uuid[],
    '2011c1d4-0b24-46a9-9320-6ef50f339a64'
  ),
  (
    'b24ad735-8c7d-4987-ab57-caed4c2bb206', -- M1: combine K1 + V3
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['7cb83c3e-a931-4d4a-9161-fdbec74daf38', '33333333-3333-4333-8333-000000000303']::uuid[],
    '85e318e3-1c31-41b9-9a90-d1d44a38adf5'
  ),
  (
    '09f0191f-dfe0-41ec-a22c-92e59792bf8a', -- M2: combine K3 + V7
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['5cb34229-a03a-4254-9d8d-657197d0d2c1', '33333333-3333-4333-8333-000000000307']::uuid[],
    'bb86f3de-5582-4604-8048-b776895d3309'
  ),
  (
    'd3f7bf11-5011-4bce-807c-8d08fed7b48c', -- M3: combine K5 + K6
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['2f149644-003e-4a19-9a26-43861f517d48', '9b2ece36-0461-4929-8b56-cba3d46e0d23']::uuid[],
    '3e4cdbb4-d697-4142-8d6f-737e9aeb0b6b'
  ),
  (
    '3be93114-488f-4089-9da7-b0761b251616', -- M4: combine K4 + V6
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['464eeb60-00fa-47a9-a109-b49213756e60', '33333333-3333-4333-8333-000000000306']::uuid[],
    'ef1f6ae9-d3ae-4035-91b6-1987f057bee0'
  ),
  (
    '82e9a793-7ba9-4f4e-b457-8da5cd3b2470', -- M5: combine K2 + V4
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['abd489db-210f-447d-8e4a-8d2ab51d4165', '33333333-3333-4333-8333-000000000304']::uuid[],
    '9f5c39ad-aaf5-4bf5-9981-baca9f395a20'
  ),
  (
    '7b8c19cc-b034-490f-98e7-c9cb6cbff2d9', -- M6: combine K8 + V4
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['2011c1d4-0b24-46a9-9320-6ef50f339a64', '33333333-3333-4333-8333-000000000304']::uuid[],
    '467885fd-3d3d-485d-af80-e21752e51ecb'
  ),
  (
    '3c66484e-8950-43ae-bfbf-d03d1563a46e', -- M7: combine V8 + K3
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['33333333-3333-4333-8333-000000000308', '5cb34229-a03a-4254-9d8d-657197d0d2c1']::uuid[],
    'aedf6b89-78d0-499d-9741-b9500b31c8fd'
  ),
  (
    'c12fba24-0d02-4e47-afc6-5a61e8193f7d', -- M8: combine M1 + M2
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['85e318e3-1c31-41b9-9a90-d1d44a38adf5', 'bb86f3de-5582-4604-8048-b776895d3309']::uuid[],
    '339c8c95-2eda-41b4-bf03-e044b4377c50'
  ),
  (
    'eafc272a-e861-4bcc-8016-2412cf243933', -- F1: combine M8 + M3
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['339c8c95-2eda-41b4-bf03-e044b4377c50', '3e4cdbb4-d697-4142-8d6f-737e9aeb0b6b']::uuid[],
    'cd32e24c-74e2-4299-824e-9dc30b828e56'
  ),
  (
    '86e57736-5cd6-40fa-8763-8c083b33f85b', -- F2: combine M1 + K6
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['85e318e3-1c31-41b9-9a90-d1d44a38adf5', '9b2ece36-0461-4929-8b56-cba3d46e0d23']::uuid[],
    '4aed047f-0c28-4496-b4f0-683df22c1601'
  ),
  (
    '62bd6cca-75c1-40f3-846b-9fd043911323', -- F3: combine M7 + M4
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['aedf6b89-78d0-499d-9741-b9500b31c8fd', 'ef1f6ae9-d3ae-4035-91b6-1987f057bee0']::uuid[],
    '43011ef1-6601-4b73-8b1e-bad6f9843dba'
  ),
  (
    '454a8f51-be71-4ced-bd4f-b84de2e73f76', -- F4: combine F1 + F3
    '11111111-1111-4111-8111-000000000003',
    'combine',
    null,
    array['cd32e24c-74e2-4299-824e-9dc30b828e56', '43011ef1-6601-4b73-8b1e-bad6f9843dba']::uuid[],
    'e1edc07e-a4ac-4b39-b744-f7c56a65b64a'
  )
on conflict (id) do nothing;

commit;
