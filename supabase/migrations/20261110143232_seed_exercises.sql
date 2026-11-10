-- Catálogo global de ejercicios (user_id null). 44 ejercicios.
-- Idempotente: se puede correr de nuevo sin duplicar.
insert into public.exercises (user_id, name, muscle_group, equipment) values
  -- Pecho (9)
  (null, 'Press banca plano', 'Pecho', 'Barra'),
  (null, 'Press banca inclinado', 'Pecho', 'Barra'),
  (null, 'Press plano', 'Pecho', 'Mancuernas'),
  (null, 'Press inclinado', 'Pecho', 'Mancuernas'),
  (null, 'Aperturas', 'Pecho', 'Mancuernas'),
  (null, 'Cruce de poleas', 'Pecho', 'Polea'),
  (null, 'Press de pecho', 'Pecho', 'Máquina'),
  (null, 'Fondos en paralelas', 'Pecho', 'Peso corporal'),
  (null, 'Flexiones', 'Pecho', 'Peso corporal'),
  -- Espalda (7)
  (null, 'Dominadas', 'Espalda', 'Peso corporal'),
  (null, 'Jalón al pecho', 'Espalda', 'Polea'),
  (null, 'Remo con barra', 'Espalda', 'Barra'),
  (null, 'Remo con mancuerna', 'Espalda', 'Mancuernas'),
  (null, 'Remo sentado en polea', 'Espalda', 'Polea'),
  (null, 'Peso muerto', 'Espalda', 'Barra'),
  (null, 'Pullover en polea', 'Espalda', 'Polea'),
  -- Hombros (6)
  (null, 'Press militar', 'Hombros', 'Barra'),
  (null, 'Press de hombros', 'Hombros', 'Mancuernas'),
  (null, 'Elevaciones laterales', 'Hombros', 'Mancuernas'),
  (null, 'Elevaciones frontales', 'Hombros', 'Mancuernas'),
  (null, 'Vuelos posteriores', 'Hombros', 'Mancuernas'),
  (null, 'Face pull', 'Hombros', 'Polea'),
  -- Bíceps (5)
  (null, 'Curl con barra', 'Bíceps', 'Barra'),
  (null, 'Curl alternado', 'Bíceps', 'Mancuernas'),
  (null, 'Curl martillo', 'Bíceps', 'Mancuernas'),
  (null, 'Curl en banco Scott', 'Bíceps', 'Barra'),
  (null, 'Curl en polea', 'Bíceps', 'Polea'),
  -- Tríceps (4)
  (null, 'Extensión en polea', 'Tríceps', 'Polea'),
  (null, 'Press francés', 'Tríceps', 'Barra'),
  (null, 'Extensión sobre la cabeza', 'Tríceps', 'Mancuernas'),
  (null, 'Press cerrado', 'Tríceps', 'Barra'),
  -- Piernas (7)
  (null, 'Sentadilla', 'Piernas', 'Barra'),
  (null, 'Prensa', 'Piernas', 'Máquina'),
  (null, 'Sentadilla búlgara', 'Piernas', 'Mancuernas'),
  (null, 'Estocadas', 'Piernas', 'Mancuernas'),
  (null, 'Sillón de cuádriceps', 'Piernas', 'Máquina'),
  (null, 'Camilla de isquios', 'Piernas', 'Máquina'),
  (null, 'Peso muerto rumano', 'Piernas', 'Barra'),
  -- Glúteos (2)
  (null, 'Hip thrust', 'Glúteos', 'Barra'),
  (null, 'Patada de glúteo', 'Glúteos', 'Polea'),
  -- Gemelos (2)
  (null, 'Elevación de talones de pie', 'Gemelos', 'Máquina'),
  (null, 'Elevación de talones sentado', 'Gemelos', 'Máquina'),
  -- Abdominales (2)
  (null, 'Crunch en polea', 'Abdominales', 'Polea'),
  (null, 'Elevación de piernas colgado', 'Abdominales', 'Peso corporal')
on conflict (lower(name)) where user_id is null do nothing;
