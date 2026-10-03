-- Aprobado por Ociel 25-09-2026: borrar los 2 colaboradores de prueba (seed manual del 15-09).
delete from public.verified_contributors
where handle in ('@gallados_lab', '@ociel.gallardoestiven')
  and source = 'ig';
