// Generat din free-exercise-db (domeniu public): poze, descrieri în română și mușchi pentru exercițiile de start.
// Pozele sunt în public/catalog/img/.
export const SEED_MEDIA: Record<
  string,
  { description: string; image_url: string; primary_muscles: string[]; secondary_muscles: string[] }
> = {
  'Împins la piept cu bară': {
    description:
      'Culcat pe bancă, cu ochii sub bară și tălpile pe podea. Prinzi bara puțin mai larg decât umerii, omoplații strânși și lipiți de bancă.\nCobori controlat bara până atinge pieptul, în dreptul sfârcurilor, cu coatele la ~45° față de corp.\nÎmpingi bara în sus până întinzi brațele, fără să ridici fesierii de pe bancă.',
    image_url: 'catalog/img/Barbell_Bench_Press_-_Medium_Grip.jpg',
    primary_muscles: ['chest'],
    secondary_muscles: ['front-deltoids', 'back-deltoids', 'triceps'],
  },
  'Împins înclinat cu gantere': {
    description:
      'Banca înclinată la 30–45°. Stai cu spatele lipit, câte o gantera în fiecare mână, la nivelul umerilor, palmele spre înainte.\nÎmpingi ganterele în sus până aproape se ating deasupra pieptului.\nCobori încet, până simți întinderea în partea de sus a pieptului.',
    image_url: 'catalog/img/Incline_Dumbbell_Press.jpg',
    primary_muscles: ['chest'],
    secondary_muscles: ['front-deltoids', 'back-deltoids', 'triceps'],
  },
  'Fluturări la cablu': {
    description:
      'Scripeții sus, câte un mâner în fiecare mână. Faci un pas în față, trunchiul ușor aplecat, coatele puțin îndoite și fixe.\nAduci mânerele în arc, în fața pieptului, până se întâlnesc. Strângi pieptul o secundă.\nRevii încet, până simți întinderea pieptului, fără să schimbi unghiul coatelor.',
    image_url: 'catalog/img/Cable_Crossover.jpg',
    primary_muscles: ['chest'],
    secondary_muscles: ['front-deltoids', 'back-deltoids'],
  },
  Tracțiuni: {
    description:
      'Te prinzi de bară cu palmele spre înainte, puțin mai larg decât umerii, și atârni cu brațele întinse.\nTragi coatele în jos și spre spate până bărbia trece de bară. Pieptul spre bară, fără balans.\nCobori controlat până la brațe întinse.',
    image_url: 'catalog/img/Pullups.jpg',
    primary_muscles: ['upper-back'],
    secondary_muscles: ['biceps'],
  },
  'Ramat cu bară': {
    description:
      'Ții bara cu palmele spre tine, genunchii ușor îndoiți. Te apleci din șold, cu spatele drept, aproape paralel cu podeaua.\nTragi bara spre buric, cu coatele pe lângă corp, și strângi omoplații sus.\nCobori bara încet, fără să rotunjești spatele.',
    image_url: 'catalog/img/Bent_Over_Barbell_Row.jpg',
    primary_muscles: ['upper-back'],
    secondary_muscles: ['biceps', 'front-deltoids', 'back-deltoids'],
  },
  'Lat pulldown': {
    description:
      'Așezat la aparat, coapsele fixate sub suport. Prinzi bara larg, cu palmele spre înainte.\nCu pieptul sus și trunchiul ușor înclinat pe spate, tragi bara spre partea de sus a pieptului, ducând coatele în jos.\nLași bara să urce încet până la brațe întinse.',
    image_url: 'catalog/img/Wide-Grip_Lat_Pulldown.jpg',
    primary_muscles: ['upper-back'],
    secondary_muscles: ['biceps', 'front-deltoids', 'back-deltoids'],
  },
  'Ramat la cablu': {
    description:
      'Așezat, tălpile pe suport, genunchii ușor îndoiți. Prinzi mânerul cu brațele întinse și spatele drept.\nTragi mânerul spre abdomen, cu coatele pe lângă corp, și strângi omoplații.\nRevii încet, fără să te apleci mult în față.',
    image_url: 'catalog/img/Seated_Cable_Rows.jpg',
    primary_muscles: ['upper-back'],
    secondary_muscles: ['biceps', 'front-deltoids', 'back-deltoids'],
  },
  'Presă militară': {
    description:
      'În picioare, bara pe partea de sus a pieptului, prinsă puțin mai larg decât umerii. Abdomenul și fesierii strânși.\nÎmpingi bara drept deasupra capului până întinzi brațele. Capul trece ușor în față, sub bară.\nCobori controlat înapoi la piept, fără să arcuiești spatele.',
    image_url: 'catalog/img/Standing_Military_Press.jpg',
    primary_muscles: ['front-deltoids', 'back-deltoids'],
    secondary_muscles: ['triceps'],
  },
  'Ridicări laterale': {
    description:
      'În picioare, câte o gantera în fiecare mână, pe lângă corp, coatele puțin îndoite.\nRidici brațele lateral până la nivelul umerilor, cu degetul mic ușor mai sus.\nCobori încet. Fără elan din trunchi; greutatea mică e mai bună.',
    image_url: 'catalog/img/Side_Lateral_Raise.jpg',
    primary_muscles: ['front-deltoids', 'back-deltoids'],
    secondary_muscles: [],
  },
  'Flexii cu bară EZ': {
    description:
      'În picioare, bara EZ prinsă pe porțiunile înclinate, cu palmele în sus. Coatele lipite de corp.\nFlectezi brațele și aduci bara spre umeri, mișcând doar antebrațele.\nCobori încet până la brațe aproape întinse.',
    image_url: 'catalog/img/EZ-Bar_Curl.jpg',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
  },
  'Flexii ciocan': {
    description:
      'În picioare, câte o gantera în fiecare mână, cu palmele față în față, ca și cum ai ține un ciocan.\nRidici ganterele spre umeri, cu coatele fixe pe lângă corp.\nCobori încet. Poți alterna brațele.',
    image_url: 'catalog/img/Hammer_Curls.jpg',
    primary_muscles: ['biceps'],
    secondary_muscles: [],
  },
  'Extensii triceps la cablu': {
    description:
      'În fața scripetelui de sus, prinzi bara sau frânghia. Coatele lipite de corp, trunchiul ușor aplecat.\nÎmpingi în jos până întinzi complet brațele. Doar antebrațele se mișcă.\nLași mânerul să urce încet până la ~90° la cot.',
    image_url: 'catalog/img/Triceps_Pushdown.jpg',
    primary_muscles: ['triceps'],
    secondary_muscles: [],
  },
  Genuflexiuni: {
    description:
      'Bara pe partea de sus a spatelui, nu pe gât. Tălpile la lățimea umerilor, vârfurile ușor spre exterior.\nCobori împingând șoldul înapoi și în jos, cu genunchii în direcția vârfurilor, până coapsele ajung cel puțin paralele cu podeaua.\nUrci împingând prin călcâie, cu spatele drept și pieptul sus.',
    image_url: 'catalog/img/Barbell_Squat.jpg',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['calves', 'gluteal', 'hamstring', 'lower-back'],
  },
  'Presă picioare': {
    description:
      'Așezat la aparat, spatele lipit de spătar, tălpile pe platformă la lățimea umerilor.\nDeblochezi platforma și o cobori încet până genunchii ajung la ~90°, fără să ridici fesierii de pe scaun.\nÎmpingi prin călcâie, fără să blochezi complet genunchii sus.',
    image_url: 'catalog/img/Leg_Press.jpg',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['calves', 'gluteal', 'hamstring'],
  },
  'Îndreptări românești': {
    description:
      'În picioare, bara în mâini în fața coapselor, genunchii ușor îndoiți și fixați.\nÎmpingi șoldul înapoi și cobori bara pe lângă picioare, cu spatele drept, până simți întinderea femuralilor (de obicei sub genunchi).\nRevii în picioare împingând șoldul în față și strângând fesierii.',
    image_url: 'catalog/img/Romanian_Deadlift.jpg',
    primary_muscles: ['hamstring'],
    secondary_muscles: ['calves', 'gluteal', 'lower-back'],
  },
  'Flexii picioare': {
    description:
      'Culcat cu fața în jos la aparat, rola pe partea de jos a gambelor, puțin deasupra călcâielor. Genunchii chiar la marginea băncii.\nAduci călcâiele spre fesieri, fără să ridici șoldul de pe bancă.\nRevii încet până aproape de picioare întinse.',
    image_url: 'catalog/img/Lying_Leg_Curls.jpg',
    primary_muscles: ['hamstring'],
    secondary_muscles: [],
  },
  'Hip thrust': {
    description:
      'Partea de sus a spatelui pe marginea băncii, bara pe șold (cu un burete), tălpile pe podea la lățimea șoldului.\nÎmpingi șoldul în sus până corpul ajunge drept de la umeri la genunchi. Strângi fesierii o secundă sus.\nCobori controlat, fără să arcuiești spatele.',
    image_url: 'catalog/img/Barbell_Hip_Thrust.jpg',
    primary_muscles: ['gluteal'],
    secondary_muscles: ['calves', 'hamstring'],
  },
  'Ridicări pe vârfuri': {
    description:
      'La aparat, umerii sub perne, vârfurile tălpilor pe marginea treptei, călcâiele în aer.\nTe ridici pe vârfuri cât de sus poți și ții o secundă.\nCobori încet călcâiele sub nivelul treptei, până simți întinderea gambei.',
    image_url: 'catalog/img/Standing_Calf_Raises.jpg',
    primary_muscles: ['calves'],
    secondary_muscles: [],
  },
  Plank: {
    description:
      'Sprijinit pe antebrațe și vârfurile picioarelor, coatele sub umeri.\nCorpul drept de la cap la călcâie: abdomenul și fesierii strânși, șoldul nici prea sus, nici lăsat.\nRespiri normal și ții poziția timpul propus.',
    image_url: 'catalog/img/Plank.jpg',
    primary_muscles: ['abs', 'obliques'],
    secondary_muscles: [],
  },
}
