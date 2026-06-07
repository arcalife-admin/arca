-- Replace placeholder surgical procedure catalog with clinic price list

DELETE FROM "UserProcedurePrice";
DELETE FROM "SurgicalProcedure";
DELETE FROM "SurgicalProcedureCode";

INSERT INTO "SurgicalProcedureCode"
  ("id", "code", "description", "price", "currency", "category", "section", "subSection", "requirements", "duration", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'INJ', 'Injectare', 300, 'RON', 'non-surgical', 'Proceduri Non-Chirurgicale', 'Injectii', '{"bodyArea":"face","procedureType":"injection","anesthesiaType":"none"}'::jsonb, 30, NOW(), NOW()),
  (gen_random_uuid()::text, 'IMPL', 'Implant', 900, 'EUR', 'breast', 'Chirurgie San', 'Augmentare', '{"bodyArea":"breast","procedureType":"breast_implant","anesthesiaType":"general"}'::jsonb, 120, NOW(), NOW()),
  (gen_random_uuid()::text, 'IMPL-ROUND', 'Implant cu round', 1100, 'EUR', 'breast', 'Chirurgie San', 'Augmentare', '{"bodyArea":"breast","procedureType":"breast_implant","anesthesiaType":"general"}'::jsonb, 150, NOW(), NOW()),
  (gen_random_uuid()::text, 'IMPL-LIFT', 'Implant cu ridicare / reductie', 1150, 'EUR', 'breast', 'Chirurgie San', 'Augmentare + Ridicare', '{"bodyArea":"breast","procedureType":"breast_lift","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'RINO', 'Rinoplastie', 900, 'EUR', 'facial', 'Chirurgie Faciala', 'Nas', '{"bodyArea":"face","procedureType":"rhinoplasty","anesthesiaType":"general"}'::jsonb, 120, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIPO', 'Lipoaspiratie', 1300, 'EUR', 'body', 'Chirurgie Corporala', 'Conturare', '{"bodyArea":"body","procedureType":"liposuction","anesthesiaType":"general"}'::jsonb, 120, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIPO-ABDO', 'Lipo. + Abdomino.', 1500, 'EUR', 'combo', 'Interventii Combinate', 'Corp', '{"bodyArea":"body","procedureType":"abdominoplasty","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIPO-LIP', 'Lipo + lipectomie', 1400, 'EUR', 'combo', 'Interventii Combinate', 'Corp', '{"bodyArea":"body","procedureType":"liposuction","anesthesiaType":"general"}'::jsonb, 150, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIPO-LIPF-ABDO', 'Lipo + Lipofilling + Abdomino', 1500, 'EUR', 'combo', 'Interventii Combinate', 'Corp', '{"bodyArea":"body","procedureType":"abdominoplasty","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIPO-RID', 'Lipo. + Ridicare', 1500, 'EUR', 'combo', 'Interventii Combinate', 'Corp', '{"bodyArea":"body","procedureType":"body_lift","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIPO-LIPF', 'Lipo + Lipofilling', 1400, 'EUR', 'combo', 'Interventii Combinate', 'Corp', '{"bodyArea":"body","procedureType":"liposuction","anesthesiaType":"general"}'::jsonb, 150, NOW(), NOW()),
  (gen_random_uuid()::text, 'ABDO-RID', 'Abdomino. + Ridicare', 1500, 'EUR', 'combo', 'Interventii Combinate', 'Corp', '{"bodyArea":"body","procedureType":"abdominoplasty","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'IMPL-RINO', 'Implant + Rinoplastie', 1500, 'EUR', 'combo', 'Interventii Combinate', 'San + Fata', '{"bodyArea":"other","procedureType":"other","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'IMPL-LIPO', 'Implant + Lipoaspiratie', 1600, 'EUR', 'combo', 'Interventii Combinate', 'San + Corp', '{"bodyArea":"other","procedureType":"other","anesthesiaType":"general"}'::jsonb, 210, NOW(), NOW()),
  (gen_random_uuid()::text, 'RINO-LIPO', 'Rinoplastie + Lipoaspiratie', 1600, 'EUR', 'combo', 'Interventii Combinate', 'Fata + Corp', '{"bodyArea":"other","procedureType":"other","anesthesiaType":"general"}'::jsonb, 210, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIFT-FAC', 'Lifting facial', 1000, 'EUR', 'facial', 'Chirurgie Faciala', 'Lifting', '{"bodyArea":"face","procedureType":"face_lift","anesthesiaType":"general"}'::jsonb, 150, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIFT-COAP', 'Lifting coapse', 1300, 'EUR', 'body', 'Chirurgie Corporala', 'Lifting', '{"bodyArea":"body","procedureType":"thigh_lift","anesthesiaType":"general"}'::jsonb, 150, NOW(), NOW()),
  (gen_random_uuid()::text, 'BRAHIO', 'Brahioplastie', 1200, 'EUR', 'body', 'Chirurgie Corporala', 'Brate', '{"bodyArea":"body","procedureType":"arm_lift","anesthesiaType":"general"}'::jsonb, 120, NOW(), NOW()),
  (gen_random_uuid()::text, 'REV', 'Revizie (500 euro / + N 100)', 500, 'EUR', 'other', 'Alte Proceduri', 'Revizie', '{"bodyArea":"other","procedureType":"revision","anesthesiaType":"general","notes":"500 euro / + N 100"}'::jsonb, 60, NOW(), NOW()),
  (gen_random_uuid()::text, 'SED', 'Sedare (500 euro / + N 100)', 500, 'EUR', 'anesthesia', 'Anestezie', 'Sedare', '{"bodyArea":"other","procedureType":"sedation","anesthesiaType":"sedation","notes":"500 euro / + N 100"}'::jsonb, 60, NOW(), NOW()),
  (gen_random_uuid()::text, 'URG', 'URGENTA', 500, 'EUR', 'other', 'Alte Proceduri', 'Urgenta', '{"bodyArea":"other","procedureType":"emergency","anesthesiaType":"general"}'::jsonb, 60, NOW(), NOW()),
  (gen_random_uuid()::text, 'LOC-SALA', 'Locala in sala', 400, 'EUR', 'anesthesia', 'Anestezie', 'Locala', '{"bodyArea":"other","procedureType":"anesthesia","anesthesiaType":"local"}'::jsonb, 30, NOW(), NOW()),
  (gen_random_uuid()::text, 'LOC-CAB', 'Locala in cabinet', 300, 'EUR', 'anesthesia', 'Anestezie', 'Locala', '{"bodyArea":"other","procedureType":"anesthesia","anesthesiaType":"local"}'::jsonb, 30, NOW(), NOW()),
  (gen_random_uuid()::text, 'LOC-PLAS', 'Locala plastica (alunite, nevi..)', 250, 'EUR', 'anesthesia', 'Anestezie', 'Locala', '{"bodyArea":"other","procedureType":"minor_surgery","anesthesiaType":"local"}'::jsonb, 30, NOW(), NOW()),
  (gen_random_uuid()::text, 'BLEPH-SED', 'Blefaroplastie cu generala/ sedare', 700, 'EUR', 'facial', 'Chirurgie Faciala', 'Pleoape', '{"bodyArea":"face","procedureType":"blepharoplasty","anesthesiaType":"sedation"}'::jsonb, 90, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIPO-GUSA', 'Lipo gusa cu locala', 700, 'EUR', 'body', 'Chirurgie Corporala', 'Gusa', '{"bodyArea":"body","procedureType":"liposuction","anesthesiaType":"local"}'::jsonb, 60, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIPO-LOC', 'Lipoaspiratie cu locala', 800, 'EUR', 'body', 'Chirurgie Corporala', 'Conturare', '{"bodyArea":"body","procedureType":"liposuction","anesthesiaType":"local"}'::jsonb, 90, NOW(), NOW()),
  (gen_random_uuid()::text, 'IMPL-LAB', 'Implant + Labioplastie', 1400, 'EUR', 'combo', 'Interventii Combinate', 'San + Intim', '{"bodyArea":"other","procedureType":"other","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'IMPL-BLEPH', 'Implant + Blefaroplastie', 1400, 'EUR', 'combo', 'Interventii Combinate', 'San + Fata', '{"bodyArea":"other","procedureType":"other","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'RINO-BLEPH', 'Rinoplastie + Blefaroplastie', 1400, 'EUR', 'combo', 'Interventii Combinate', 'Fata', '{"bodyArea":"face","procedureType":"other","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'RINO-LAB', 'Rinoplastie + Labioplastie', 1300, 'EUR', 'combo', 'Interventii Combinate', 'Fata + Intim', '{"bodyArea":"other","procedureType":"other","anesthesiaType":"general"}'::jsonb, 180, NOW(), NOW()),
  (gen_random_uuid()::text, 'LAB-LOC', 'Labio cu locala', 600, 'EUR', 'other', 'Proceduri Intime', 'Labioplastie', '{"bodyArea":"other","procedureType":"labiaplasty","anesthesiaType":"local"}'::jsonb, 60, NOW(), NOW()),
  (gen_random_uuid()::text, 'LAB-SED', 'Labio cu generala/ sedare', 800, 'EUR', 'other', 'Proceduri Intime', 'Labioplastie', '{"bodyArea":"other","procedureType":"labiaplasty","anesthesiaType":"sedation"}'::jsonb, 90, NOW(), NOW());
