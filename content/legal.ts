import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/lib/site";
import {
  legalEntityDesignation,
  legalIdentity,
  legalIdentityRows,
  privacyContactEmail,
} from "@/lib/legal";

/**
 * Documentos legales del sitio como datos estructurados.
 *
 * - El español es la versión principal; el inglés es una traducción fiel y,
 *   ante cualquier diferencia, prevalece el español.
 * - Los datos de identidad (razón social, NIT, domicilio…) vienen de
 *   `lib/legal.ts`; mientras estén en `null` el texto se lee sin ellos.
 * - En los párrafos, `[texto](doc:slug)` enlaza a otro documento legal,
 *   `[texto](#id)` a una sección y los correos se enlazan solos.
 */

export type LegalBlock =
  | string
  | { list: string[]; ordered?: boolean };

export type LegalSection = {
  id: string;
  title: string;
  body: LegalBlock[];
};

export type LegalDoc = {
  slug: LegalSlug;
  title: string;
  summary: string;
  metaDescription: string;
  intro: LegalBlock[];
  sections: LegalSection[];
};

export const legalSlugs = [
  "terminos",
  "privacidad",
  "cookies",
  "aviso-privacidad",
  "uso-aceptable",
] as const;

export type LegalSlug = (typeof legalSlugs)[number];

export function isLegalSlug(value: string): value is LegalSlug {
  return (legalSlugs as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Textos de interfaz                                                          */
/* -------------------------------------------------------------------------- */

export const legalUi = {
  es: {
    hubTitle: "Centro legal",
    hubMetaTitle: "Centro legal",
    hubIntro:
      "Aquí encuentras las condiciones con las que trabajamos y cómo tratamos tu información. Los escribimos en lenguaje claro para que sepas qué esperar antes, durante y después de contratar con Engynex.",
    hubMetaDescription:
      "Términos y condiciones, política de tratamiento de datos personales, cookies, aviso de privacidad y uso aceptable de Engynex.",
    read: "Leer",
    lastUpdated: "Última actualización",
    onThisPage: "En esta página",
    tocLabel: "Contenido del documento",
    otherDocs: "Otros documentos",
    contactTitle: "¿Tienes preguntas sobre estos documentos?",
    contactText:
      "Escríbenos y te respondemos en horario hábil. Si tu solicitud es sobre tus datos personales, indícalo en el asunto para darle el trámite de ley.",
    contactEmail: "Escribir un correo",
    contactWhatsapp: "WhatsApp",
    backToHub: "Centro legal",
    prevailNote: "",
    hubDocsLabel: "Documentos legales",
  },
  en: {
    hubTitle: "Legal Center",
    hubMetaTitle: "Legal Center",
    hubIntro:
      "Here you'll find the terms we work under and how we handle your information. We wrote them in plain language so you know what to expect before, during and after working with Engynex.",
    hubMetaDescription:
      "Engynex terms and conditions, personal data processing policy, cookies, privacy notice and acceptable use.",
    read: "Read",
    lastUpdated: "Last updated",
    onThisPage: "On this page",
    tocLabel: "Document contents",
    otherDocs: "Other documents",
    contactTitle: "Questions about these documents?",
    contactText:
      "Write to us and we'll reply during business hours. If your request concerns your personal data, say so in the subject line so we can process it as the law requires.",
    contactEmail: "Send an email",
    contactWhatsapp: "WhatsApp",
    backToHub: "Legal Center",
    prevailNote:
      "This English version is a courtesy translation. The Spanish version is the legally binding text and prevails in case of any discrepancy.",
    hubDocsLabel: "Legal documents",
  },
} satisfies Record<Locale, Record<string, string>>;

/* -------------------------------------------------------------------------- */
/* Documentos                                                                  */
/* -------------------------------------------------------------------------- */

function buildDocs(locale: Locale): LegalDoc[] {
  const entity = legalEntityDesignation(locale);
  const email = legalIdentity.email;
  const pEmail = privacyContactEmail();
  const phone = legalIdentity.phone;
  const hours = siteConfig.hours[locale];
  const idRows = legalIdentityRows(locale);

  if (locale === "es") {
    return [
      /* ============================== TÉRMINOS ============================== */
      {
        slug: "terminos",
        title: "Términos y condiciones",
        summary:
          "Las reglas para usar este sitio y contratar nuestros servicios, planes y productos.",
        metaDescription:
          "Términos y condiciones de uso del sitio de Engynex y de contratación de servicios de desarrollo, marketing, nube, soporte, hosting, alquiler de equipos y productos de software.",
        intro: [
          `Estos términos y condiciones regulan el uso del sitio web ${legalIdentity.domain} y la contratación de los servicios y productos que ofrece ${entity}. Te pedimos leerlos con atención: al usar el sitio o contratar con nosotros, los aceptas.`,
        ],
        sections: [
          {
            id: "objeto",
            title: "1. Objeto y ámbito de aplicación",
            body: [
              "Engynex es una empresa colombiana de desarrollo digital que atiende clientes en Colombia y Latinoamérica. Ofrece, entre otros, desarrollo de sitios web, aplicaciones y plataformas; marketing digital; producción audiovisual; soluciones de inteligencia artificial; servicios en la nube; ciberseguridad; hosting y mantenimiento; soporte de tecnología; alquiler de equipos, y productos de software propios, algunos bajo suscripción mensual.",
              "Estos términos aplican a toda persona que navegue por el sitio (el «usuario») y a toda persona natural o jurídica que contrate un servicio o producto de Engynex (el «cliente»). Cuando exista una propuesta comercial, cotización formal, orden de servicio o contrato firmado con el cliente (la «propuesta»), sus condiciones particulares prevalecen sobre estos términos en lo que regulen de forma distinta; en lo no previsto, se aplican estos términos.",
            ],
          },
          {
            id: "aceptacion",
            title: "2. Aceptación",
            body: [
              "El uso del sitio implica la aceptación de estos términos. La contratación de un servicio o producto implica, además, la aceptación de la propuesta correspondiente, que puede darse por firma, por correo electrónico, por mensaje escrito o con el pago del anticipo o de la primera mensualidad.",
              "Si actúas en nombre de una empresa, declaras que tienes facultades para obligarla. Si no estás de acuerdo con estos términos, te pedimos no usar el sitio ni contratar nuestros servicios.",
            ],
          },
          {
            id: "definiciones",
            title: "3. Definiciones",
            body: [
              {
                list: [
                  "Servicios: las actividades profesionales que Engynex presta al cliente según la propuesta (desarrollo, marketing, audiovisual, nube, soporte, hosting, alquiler de equipos, entre otros).",
                  "Productos: el software propio de Engynex que se implementa para el cliente, ya sea bajo suscripción o mediante pago único.",
                  "Plan mensual o suscripción: modalidad en la que el cliente paga una tarifa periódica por un servicio o producto durante el tiempo acordado.",
                  "Entregables: los resultados finales que Engynex entrega al cliente según la propuesta, como diseños, código fuente desarrollado a la medida, piezas gráficas, videos o documentación.",
                  "Propuesta: la cotización formal, orden de servicio o contrato que describe alcance, precio, plazos y condiciones particulares de cada contratación.",
                ],
              },
            ],
          },
          {
            id: "uso-del-sitio",
            title: "4. Uso del sitio web",
            body: [
              "La información del sitio sobre servicios, productos, planes y precios es general y referencial. Procuramos mantenerla actualizada y correcta, pero puede contener errores o cambiar sin previo aviso, y no constituye por sí sola una oferta vinculante.",
              "Al usar el sitio te comprometes a no:",
              {
                list: [
                  "usarlo con fines ilícitos o contrarios a estos términos;",
                  "intentar acceder sin autorización a sus sistemas, alterar su funcionamiento o introducir código malicioso;",
                  "enviar información falsa o de terceros sin su autorización a través de los formularios;",
                  "copiar, reproducir o explotar comercialmente sus contenidos, marcas, textos o imágenes sin autorización previa y por escrito.",
                ],
              },
              "El sitio puede incluir enlaces a sitios de terceros, como WhatsApp o redes sociales. Engynex no controla esos sitios y no responde por su contenido ni por sus políticas; su uso se rige por las condiciones de cada tercero.",
            ],
          },
          {
            id: "servicios-cotizaciones",
            title: "5. Servicios, cotizaciones y propuestas",
            body: [
              "Los precios publicados en el sitio son precios de referencia «desde», expresados en pesos colombianos y antes de IVA. Las estimaciones que entregan el cotizador u otras herramientas del sitio son orientativas.",
              "El precio final, el alcance, los plazos y las condiciones de cada servicio se fijan en la propuesta escrita que Engynex envía al cliente, la cual incluye el desglose de impuestos. La propuesta tiene la vigencia indicada en ella.",
              "Engynex presta únicamente lo descrito en la propuesta. Cualquier funcionalidad, pieza, ajuste o actividad adicional se considera un cambio de alcance y se cotiza por separado antes de ejecutarse.",
              "Salvo que la propuesta diga otra cosa, no están incluidos los costos de terceros, como la inversión en pauta publicitaria (que el cliente paga directamente a la plataforma correspondiente), dominios, licencias de software o plantillas, bancos de imágenes, pasarelas de pago o servicios en la nube contratados a nombre del cliente.",
            ],
          },
          {
            id: "pagos",
            title: "6. Precios, facturación y pagos",
            body: [
              "Salvo que la propuesta establezca otra forma de pago:",
              {
                list: [
                  "En proyectos de pago único se paga un 50% de anticipo para iniciar y el 50% restante contra entrega.",
                  "En proyectos grandes, el pago se divide por hitos según el cronograma de la propuesta.",
                  "Los planes mensuales se facturan al inicio de cada mes de servicio.",
                ],
              },
              "Recibimos pagos por transferencia bancaria, PSE y tarjeta. Para clientes fuera de Colombia podemos facturar en dólares estadounidenses cuando así se acuerde. A los valores se suma el IVA y los demás impuestos que correspondan según la ley.",
              "El inicio de los trabajos está sujeto a la recepción del anticipo o de la primera mensualidad. Si un pago no se recibe en la fecha acordada, Engynex puede, previo aviso al cliente, suspender la ejecución o la prestación del servicio hasta que se ponga al día, sin perjuicio de las demás acciones que la ley le permita. Los plazos de entrega se extienden por el tiempo de la suspensión.",
            ],
          },
          {
            id: "suscripciones",
            title: "7. Planes mensuales y suscripciones",
            body: [
              "La duración y la permanencia mínima de cada plan mensual son las indicadas en el plan publicado o en la propuesta, y siempre quedan por escrito antes de empezar. Según el servicio, los planes mensuales se acuerdan por 3 o 12 meses. Los proyectos de pago único no tienen permanencia.",
              "Página web por suscripción. En esta modalidad:",
              {
                list: [
                  "No hay cuota inicial: el cliente paga una mensualidad y Engynex pone el dominio, el hosting, el certificado SSL y el mantenimiento mientras la suscripción esté activa.",
                  "La permanencia mínima es de 12 meses.",
                  "El dominio queda registrado a nombre del cliente. Si el cliente cancela la suscripción, Engynex le transfiere el dominio.",
                  "Al cancelar, el sitio deja de estar publicado en la infraestructura de Engynex. El cliente puede migrar a la modalidad de pago único pagando la diferencia del desarrollo.",
                ],
              },
              "Productos de software. Los productos de Engynex pueden contratarse por suscripción mensual con soporte incluido o por pago único con el código a nombre del cliente, según se indique en la propuesta.",
              "La cancelación de un plan debe solicitarse por escrito. Las consecuencias de terminar un plan antes de cumplir la permanencia mínima son las previstas en la propuesta. Las mensualidades ya facturadas por periodos en curso no se prorratean, salvo que la propuesta disponga otra cosa.",
            ],
          },
          {
            id: "obligaciones-cliente",
            title: "8. Obligaciones del cliente",
            body: [
              "Para que podamos cumplir lo acordado, el cliente se compromete a:",
              {
                list: [
                  "entregar a tiempo la información, contenidos, accesos y aprobaciones que el proyecto requiera, y designar una persona de contacto con capacidad de decisión;",
                  "garantizar que tiene los derechos sobre los textos, logos, imágenes, videos, datos y demás materiales que entrega, y que su uso no infringe derechos de terceros ni la ley;",
                  "revisar los avances y entregables dentro de los plazos acordados;",
                  "pagar oportunamente los valores pactados;",
                  "custodiar las credenciales y accesos que reciba y usar los servicios conforme a la ley y a la [Política de uso aceptable](doc:uso-aceptable).",
                ],
              },
              "Los retrasos causados por la falta de información, materiales, aprobaciones o pagos a cargo del cliente extienden los plazos de entrega en el mismo tiempo, y no son imputables a Engynex.",
            ],
          },
          {
            id: "entrega",
            title: "9. Plazos, entrega y aceptación",
            body: [
              "Los plazos de cada proyecto son los del cronograma de la propuesta y empiezan a correr desde la recepción del anticipo y de la información necesaria para iniciar.",
              "Al entregar, el cliente revisa el entregable y comunica por escrito las observaciones dentro del plazo previsto en la propuesta. Engynex corrige lo que no se ajuste a lo acordado. El entregable se entiende aceptado cuando el cliente lo aprueba, cuando vence el plazo de revisión sin observaciones o cuando lo pone en uso productivo.",
            ],
          },
          {
            id: "propiedad-intelectual",
            title: "10. Propiedad intelectual",
            body: [
              "Entregables a la medida. Una vez pagado el valor total del proyecto, el cliente es titular de los derechos patrimoniales sobre los entregables finales desarrollados específicamente para él, en los términos de la legislación colombiana sobre derecho de autor. Mientras no se haya pagado la totalidad, Engynex conserva esos derechos.",
              "Herramientas preexistentes. Engynex conserva la titularidad de sus herramientas, librerías, componentes, plantillas, metodologías y conocimiento técnico preexistentes o de uso general, aunque se utilicen en el proyecto. Cuando formen parte de un entregable, el cliente recibe una licencia no exclusiva y por término indefinido para usarlos como parte de ese entregable.",
              "Componentes de terceros. El software de código abierto, las fuentes tipográficas, los bancos de imágenes, los plugins, las API y demás componentes de terceros incluidos en un entregable se rigen por sus propias licencias, que el cliente debe respetar.",
              "Productos bajo suscripción. Cuando un producto de Engynex se contrata por suscripción, el cliente recibe una licencia de uso no exclusiva e intransferible durante la vigencia de la suscripción, y Engynex conserva la propiedad intelectual del producto. En la modalidad de pago único, los derechos sobre el código son los que indique la propuesta.",
              "Datos del cliente. La información y los datos que el cliente carga o genera en las plataformas que le prestamos son del cliente.",
              "Portafolio. Engynex puede mencionar al cliente y mostrar el trabajo realizado en su portafolio y materiales comerciales, salvo que el cliente se oponga por escrito o que la información sea confidencial.",
            ],
          },
          {
            id: "garantia",
            title: "11. Garantía",
            body: [
              "Todos los desarrollos incluyen garantía sobre errores de funcionamiento por el periodo indicado en el plan o en la propuesta (entre 2 y 6 meses según el plan), contado desde la entrega. Durante ese periodo corregimos sin costo cualquier falla atribuible a nuestro trabajo.",
              "La garantía no cubre:",
              {
                list: [
                  "modificaciones hechas por el cliente o por terceros sin intervención de Engynex;",
                  "fallas de servicios, plataformas, actualizaciones o infraestructura de terceros que no administra Engynex;",
                  "nuevas funcionalidades o cambios de alcance;",
                  "el uso indebido o contrario a las instrucciones entregadas.",
                ],
              },
              "En los equipos nuevos en alquiler aplica, además, la garantía de fábrica. Lo anterior no limita la garantía legal que corresponda cuando el cliente tenga la calidad de consumidor (ver [Derechos del consumidor](#consumidor)).",
            ],
          },
          {
            id: "alquiler-equipos",
            title: "12. Alquiler de equipos",
            body: [
              "Cuando el cliente alquila equipos (computadores, portátiles, servidores, monitores, impresoras o equipos de red), además de lo previsto en la propuesta aplican estas condiciones:",
              {
                list: [
                  "Los equipos son y siguen siendo propiedad de Engynex. El cliente los recibe en calidad de tenencia para su uso durante el plazo acordado, que puede ser por días, semanas o meses.",
                  "Engynex ofrece equipos nuevos con garantía de fábrica y equipos certificados (reacondicionados) revisados por Engynex; la línea elegida consta en la propuesta.",
                  "La cuota incluye la instalación, el mantenimiento preventivo programado, el soporte y la reposición en los términos del plan. Si un equipo falla y no admite reparación inmediata, Engynex entrega un equipo de reemplazo.",
                  "El cliente debe usar los equipos de forma adecuada, mantenerlos en el lugar acordado, no abrirlos, repararlos ni modificarlos por su cuenta, e informar oportunamente cualquier falla, pérdida o daño.",
                  "Los daños causados por uso indebido, accidentes, pérdida o hurto mientras los equipos están bajo la tenencia del cliente se tratan según lo previsto en la propuesta.",
                  "Al terminar el alquiler, Engynex retira los equipos y, antes de retirarlos, hace un borrado seguro certificado de los discos y entrega el acta correspondiente.",
                ],
              },
            ],
          },
          {
            id: "confidencialidad",
            title: "13. Confidencialidad",
            body: [
              "Cada parte mantendrá en reserva la información confidencial que reciba de la otra con ocasión de la relación comercial (información técnica, comercial, financiera, de clientes o de accesos) y la usará solo para cumplir lo acordado. Esta obligación continúa después de terminada la relación.",
              "No es confidencial la información que sea pública sin culpa de quien la recibe, la que ya conocía legítimamente, la que obtenga de un tercero sin deber de reserva, ni la que deba revelarse por orden de autoridad competente.",
            ],
          },
          {
            id: "datos-personales",
            title: "14. Datos personales",
            body: [
              "Engynex trata los datos personales conforme a la Ley 1581 de 2012 y sus normas reglamentarias, según lo descrito en su [Política de Tratamiento de Datos Personales](doc:privacidad).",
              "Cuando, para prestar un servicio, Engynex trata datos personales de los clientes, usuarios o empleados del cliente (por ejemplo, en una plataforma, un producto o un hosting), actúa como encargado del tratamiento por cuenta del cliente, quien es el responsable y debe contar con las autorizaciones exigidas por la ley.",
            ],
          },
          {
            id: "responsabilidad",
            title: "15. Limitación de responsabilidad",
            body: [
              "Engynex presta sus servicios con diligencia profesional. En los servicios cuyo resultado depende de factores externos, como el posicionamiento en buscadores, el desempeño de campañas publicitarias, las ventas o los algoritmos de terceros, sus obligaciones son de medio y no de resultado.",
              "Engynex no responde por:",
              {
                list: [
                  "fallas, interrupciones o cambios de servicios de terceros, como plataformas publicitarias, redes sociales, proveedores de nube, pasarelas de pago, registradores de dominios o servicios de mensajería;",
                  "el contenido que el cliente publique o entregue, ni el uso que haga de los entregables;",
                  "daños derivados de no seguir las recomendaciones de seguridad entregadas o de credenciales mal custodiadas por el cliente;",
                  "el lucro cesante o los daños indirectos, en la medida en que la ley lo permita.",
                ],
              },
              "En la medida permitida por la ley, la responsabilidad total de Engynex frente al cliente por cualquier reclamación derivada de un servicio se limita al valor efectivamente pagado por el cliente por ese servicio durante los 12 meses anteriores al hecho que la origina. Esta limitación no aplica en casos de dolo o culpa grave, ni restringe los derechos irrenunciables del consumidor.",
            ],
          },
          {
            id: "fuerza-mayor",
            title: "16. Fuerza mayor",
            body: [
              "Ninguna de las partes será responsable por el incumplimiento o el retraso causado por fuerza mayor o caso fortuito, como desastres naturales, fallas generalizadas de energía o de internet, actos de autoridad o ataques informáticos de gran escala que no hayan podido preverse ni resistirse razonablemente. La parte afectada avisará a la otra tan pronto como sea posible y los plazos se extenderán mientras dure la situación.",
            ],
          },
          {
            id: "terminacion",
            title: "17. Terminación",
            body: [
              "La relación termina al cumplirse el objeto o el plazo acordado, por mutuo acuerdo o por las causales de la propuesta. Cualquiera de las partes puede terminarla si la otra incumple gravemente sus obligaciones y no corrige el incumplimiento dentro de un plazo razonable después de recibir aviso escrito.",
              "En caso de terminación, el cliente paga los trabajos ejecutados y los gastos incurridos hasta esa fecha, y Engynex entrega lo que haya sido pagado. Las cláusulas de propiedad intelectual, confidencialidad, datos personales y limitación de responsabilidad siguen vigentes tras la terminación.",
            ],
          },
          {
            id: "consumidor",
            title: "18. Derechos del consumidor",
            body: [
              "Cuando el cliente adquiera un servicio o producto como destinatario final, es decir, en calidad de consumidor, tiene los derechos previstos en la Ley 1480 de 2011 (Estatuto del Consumidor), que prevalecen sobre cualquier disposición de estos términos que los limite. Entre otros:",
              {
                list: [
                  "recibir información clara, veraz, suficiente y oportuna sobre los servicios, sus precios y condiciones;",
                  "la garantía legal de calidad, idoneidad y seguridad de los bienes y servicios;",
                  "el derecho de retracto en las ventas a distancia o por medios no tradicionales, dentro de los cinco (5) días hábiles siguientes a la celebración del contrato, con las excepciones del artículo 47 de la Ley 1480 de 2011; entre ellas, los servicios cuya prestación haya comenzado con el acuerdo del consumidor y los bienes confeccionados según sus especificaciones o claramente personalizados;",
                  "presentar peticiones, quejas y reclamos ante Engynex y, si es el caso, ante la Superintendencia de Industria y Comercio.",
                ],
              },
              `Puedes presentar tus peticiones, quejas y reclamos al correo ${email} o al teléfono y WhatsApp ${phone}.`,
            ],
          },
          {
            id: "ley-aplicable",
            title: "19. Ley aplicable y solución de controversias",
            body: [
              "Estos términos y las relaciones que regulan se rigen por las leyes de la República de Colombia.",
              "Las partes intentarán resolver cualquier diferencia de forma directa y de buena fe. Si no llegan a un acuerdo, la controversia se someterá a los jueces competentes de la República de Colombia, sin perjuicio de las acciones que el consumidor pueda ejercer ante la Superintendencia de Industria y Comercio.",
            ],
          },
          {
            id: "cambios",
            title: "20. Cambios a estos términos",
            body: [
              "Engynex puede actualizar estos términos. La versión vigente es la publicada en esta página, con su fecha de última actualización. Los cambios no afectan las propuestas ya aceptadas, que se rigen por los términos vigentes al momento de su aceptación, salvo que las partes acuerden otra cosa.",
            ],
          },
          {
            id: "contacto",
            title: "21. Contacto",
            body: [
              `Para cualquier pregunta sobre estos términos, escríbenos a ${email}, llámanos o escríbenos por WhatsApp al ${phone}. Horario de atención: ${hours}.`,
            ],
          },
        ],
      },

      /* ============================= PRIVACIDAD ============================= */
      {
        slug: "privacidad",
        title: "Política de Tratamiento de Datos Personales",
        summary:
          "Qué datos recogemos, para qué los usamos y cómo ejercer tus derechos como titular.",
        metaDescription:
          "Política de tratamiento de datos personales de Engynex conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).",
        intro: [
          `${entity} adopta esta política en cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto Único Reglamentario 1074 de 2015) y las demás normas que los modifiquen o complementen. Aquí explicamos cómo recolectamos, almacenamos, usamos, circulamos y suprimimos los datos personales, y cómo puedes ejercer tus derechos.`,
        ],
        sections: [
          {
            id: "responsable",
            title: "1. Responsable del tratamiento",
            body: [{ list: idRows }],
          },
          {
            id: "alcance",
            title: "2. Alcance",
            body: [
              "Esta política aplica a los datos personales que Engynex trata como responsable y que recibe a través del sitio web, de sus formularios de contacto, cotización y soporte, de WhatsApp, del correo electrónico, del teléfono, de las redes sociales y en el desarrollo de su relación con clientes, prospectos y proveedores.",
              "Cuando Engynex trata datos personales por cuenta de un cliente, como encargado del tratamiento, se aplica lo descrito en la sección [Engynex como encargado](#encargado).",
            ],
          },
          {
            id: "definiciones",
            title: "3. Definiciones",
            body: [
              "Para efectos de esta política, y de acuerdo con la Ley 1581 de 2012 y el Decreto 1377 de 2013:",
              {
                list: [
                  "Autorización: consentimiento previo, expreso e informado del titular para el tratamiento de sus datos.",
                  "Aviso de privacidad: comunicación verbal o escrita que informa al titular sobre la existencia de esta política, la forma de acceder a ella y las finalidades del tratamiento.",
                  "Base de datos: conjunto organizado de datos personales objeto de tratamiento.",
                  "Dato personal: cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables.",
                  "Dato sensible: el que afecta la intimidad del titular o cuyo uso indebido puede generar su discriminación, como el origen racial o étnico, la orientación política, las convicciones religiosas, la pertenencia a sindicatos, los datos de salud, de vida sexual y los biométricos.",
                  "Encargado del tratamiento: persona que trata datos personales por cuenta del responsable.",
                  "Responsable del tratamiento: persona que decide sobre la base de datos y el tratamiento de los datos.",
                  "Titular: persona natural cuyos datos personales son objeto de tratamiento.",
                  "Tratamiento: cualquier operación sobre datos personales, como la recolección, el almacenamiento, el uso, la circulación o la supresión.",
                  "Transferencia: envío de datos personales a un receptor que, a su vez, es responsable del tratamiento, dentro o fuera de Colombia.",
                  "Transmisión: comunicación de datos personales a un encargado, dentro o fuera de Colombia, para que los trate por cuenta del responsable.",
                ],
              },
            ],
          },
          {
            id: "principios",
            title: "4. Principios",
            body: [
              "Engynex aplica en el tratamiento los principios de legalidad, finalidad, libertad, veracidad o calidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad previstos en el artículo 4 de la Ley 1581 de 2012.",
            ],
          },
          {
            id: "datos-recolectados",
            title: "5. Datos que recolectamos",
            body: [
              "Según el canal y la relación, podemos tratar estos datos:",
              {
                list: [
                  "Datos de identificación y contacto: nombre, empresa, cargo, correo electrónico, teléfono, ciudad y país.",
                  "Datos de tu solicitud: servicio o producto de interés, presupuesto estimado, mensaje y archivos que adjuntes en los formularios de contacto, cotización o soporte.",
                  "Conversaciones: el número, el nombre de perfil y los mensajes que intercambias con nosotros por WhatsApp, correo electrónico, redes sociales o el chat en vivo del sitio (en este último, también el nombre, el correo o celular que nos dejas y la página desde la que escribes).",
                  "Datos de clientes y proveedores: documento de identificación o NIT, datos de facturación, información de pagos y la necesaria para ejecutar el contrato.",
                  "Datos de navegación: preferencias que el sitio guarda en tu navegador (tema claro u oscuro y país) y datos técnicos como la dirección IP, el tipo de navegador y las páginas visitadas, que los servidores registran por seguridad. Si aceptas las cookies de analítica, también registramos tu recorrido por el sitio con un identificador aleatorio, y si luego nos escribes, ese recorrido se une a tu solicitud. El uso de cookies se explica en la [Política de cookies](doc:cookies).",
                ],
              },
              "Los pagos con tarjeta o PSE se procesan a través de las plataformas de pago correspondientes, que tratan los datos financieros según sus propias políticas.",
            ],
          },
          {
            id: "finalidades",
            title: "6. Finalidades del tratamiento",
            body: [
              "Tratamos los datos personales para:",
              {
                list: [
                  "responder solicitudes de información, contacto y soporte;",
                  "preparar cotizaciones y propuestas comerciales;",
                  "celebrar y ejecutar los contratos, prestar los servicios, implementar los productos y gestionar la facturación, los pagos y el cobro;",
                  "brindar soporte técnico y atender peticiones, quejas y reclamos;",
                  "enviar información sobre servicios, productos, novedades y eventos de Engynex, de lo cual puedes pedir que te retiremos en cualquier momento; por WhatsApp solo lo hacemos si lo aceptaste expresamente en el formulario, y basta con responder BAJA para dejar de recibirlos;",
                  "medir la satisfacción de los clientes y mejorar nuestros servicios;",
                  "dar seguimiento a tu solicitud por correo (máximo tres mensajes, de los que puedes darte de baja con el enlace al pie) y, solo si lo autorizaste, recordarte un formulario que dejaste sin terminar;",
                  "preparar la primera conversación con ayuda de inteligencia artificial, que resume lo que nos contaste sobre tu proyecto; esa lectura no decide nada sobre ti ni cambia la prioridad que te asigna nuestro sistema;",
                  "proteger la seguridad del sitio, de los sistemas y de la información;",
                  "elaborar estadísticas internas con información agregada o anonimizada;",
                  "cumplir obligaciones legales, contables, tributarias y requerimientos de autoridades competentes.",
                ],
              },
              "Engynex no vende ni alquila datos personales.",
            ],
          },
          {
            id: "autorizacion",
            title: "7. Autorización",
            body: [
              "Engynex solicita la autorización del titular a más tardar al momento de recolectar sus datos, informándole las finalidades del tratamiento. La autorización puede otorgarse por escrito, de forma oral o mediante conductas inequívocas que permitan concluir razonablemente que fue otorgada, por ejemplo, al marcar la casilla de aceptación de un formulario o al iniciar una conversación por WhatsApp después de conocer el [Aviso de privacidad](doc:aviso-privacidad). Engynex conserva prueba de la autorización.",
              "De acuerdo con el artículo 10 de la Ley 1581 de 2012, no se requiere autorización cuando se trate de información requerida por una entidad pública o administrativa en ejercicio de sus funciones legales o por orden judicial; de datos de naturaleza pública; de casos de urgencia médica o sanitaria; del tratamiento autorizado por la ley para fines históricos, estadísticos o científicos, y de datos relacionados con el Registro Civil de las Personas.",
            ],
          },
          {
            id: "derechos",
            title: "8. Derechos de los titulares",
            body: [
              "Como titular de datos personales tienes derecho a:",
              {
                list: [
                  "conocer, actualizar y rectificar tus datos personales, incluso frente a datos parciales, inexactos, incompletos, fraccionados o que induzcan a error;",
                  "solicitar prueba de la autorización otorgada, salvo cuando la ley no la exija;",
                  "ser informado, previa solicitud, sobre el uso que se ha dado a tus datos;",
                  "presentar ante la Superintendencia de Industria y Comercio quejas por infracciones a la ley, una vez agotado el trámite de consulta o reclamo ante Engynex;",
                  "revocar la autorización y/o solicitar la supresión de tus datos cuando no se respeten los principios, derechos y garantías constitucionales y legales. La revocatoria y la supresión no proceden cuando exista un deber legal o contractual de permanecer en la base de datos;",
                  "acceder en forma gratuita a tus datos personales que hayan sido objeto de tratamiento.",
                ],
              },
              "Estos derechos pueden ejercerlos el titular, sus causahabientes, su representante o apoderado, y quien haya sido designado por estipulación a favor de otro.",
            ],
          },
          {
            id: "procedimiento",
            title: "9. Procedimiento para consultas y reclamos",
            body: [
              `Puedes ejercer tus derechos escribiendo al correo ${pEmail}, con el asunto «Datos personales», o a través del teléfono y WhatsApp ${phone}. La solicitud debe incluir tu nombre, tu documento de identificación, la descripción de lo que pides y un medio de contacto para responderte. Si actúas en nombre de otra persona, adjunta el documento que acredite tu representación.`,
              "Consultas. Si quieres conocer la información que tenemos sobre ti, la atenderemos en un término máximo de diez (10) días hábiles contados desde la fecha de recibo. Si no fuera posible responder en ese término, te informaremos los motivos de la demora y la fecha de respuesta, que no superará los cinco (5) días hábiles siguientes al vencimiento del primer término.",
              "Reclamos. Si consideras que tus datos deben ser corregidos, actualizados o suprimidos, o adviertes un incumplimiento de la ley, puedes presentar un reclamo, que se tramitará así:",
              {
                ordered: true,
                list: [
                  "El reclamo debe contener tu identificación, la descripción de los hechos que dan lugar a él, tu dirección o medio de contacto y los documentos que quieras hacer valer.",
                  "Si el reclamo está incompleto, te pediremos dentro de los cinco (5) días hábiles siguientes a su recibo que subsanes las fallas. Si transcurridos dos (2) meses desde el requerimiento no presentas la información solicitada, se entenderá que desististe del reclamo.",
                  "Si Engynex no es competente para resolverlo, lo trasladará a quien corresponda en un término máximo de dos (2) días hábiles y te informará de la situación.",
                  "Una vez recibido el reclamo completo, incluiremos en la base de datos la leyenda «reclamo en trámite» y el motivo, en un término no mayor a dos (2) días hábiles, y la mantendremos hasta que se decida.",
                  "El término máximo para atender el reclamo es de quince (15) días hábiles contados desde el día siguiente a la fecha de su recibo. Si no fuera posible atenderlo en ese término, te informaremos los motivos de la demora y la fecha en que se atenderá, que no superará los ocho (8) días hábiles siguientes al vencimiento del primer término.",
                ],
              },
              "Solo podrás elevar queja ante la Superintendencia de Industria y Comercio una vez hayas agotado el trámite de consulta o reclamo ante Engynex.",
            ],
          },
          {
            id: "datos-sensibles",
            title: "10. Datos sensibles",
            body: [
              "Engynex no solicita datos sensibles para prestar sus servicios. Si en algún caso fuera necesario tratarlos, te informaremos de forma explícita cuáles son y la finalidad, solicitaremos tu autorización expresa y te recordaremos que no estás obligado a autorizar su tratamiento ni a responder preguntas sobre ellos.",
            ],
          },
          {
            id: "menores",
            title: "11. Datos de niños, niñas y adolescentes",
            body: [
              "Nuestros servicios están dirigidos a empresas y personas mayores de edad, y no recolectamos de forma intencional datos de menores de edad a través del sitio.",
              "Cuando, en la prestación de un servicio o producto (por ejemplo, plataformas para colegios), Engynex trata datos de menores por cuenta de un cliente, lo hace como encargado, respetando el interés superior de los niños, niñas y adolescentes y sus derechos fundamentales, conforme al artículo 7 de la Ley 1581 de 2012 y a las normas que lo reglamentan. Corresponde al cliente obtener la autorización de sus representantes legales.",
            ],
          },
          {
            id: "transferencias",
            title: "12. Transmisión y transferencia de datos",
            body: [
              "Para operar, Engynex puede transmitir datos personales a proveedores que actúan como encargados, como servicios de alojamiento web y en la nube, correo electrónico, mensajería, herramientas de gestión, plataformas de pago y proveedores de inteligencia artificial (por ejemplo, Anthropic, que procesa el texto de tu solicitud para resumirlo y no lo usa para entrenar sus modelos), ubicados en Colombia o en el exterior. Con ellos se pactan las condiciones para que traten los datos solo según nuestras instrucciones y con medidas de seguridad adecuadas.",
              "Engynex solo transferirá datos personales a otros países que proporcionen niveles adecuados de protección de datos o en los casos exceptuados por el artículo 26 de la Ley 1581 de 2012. Los datos también podrán entregarse a autoridades que los soliciten en ejercicio de sus funciones legales.",
            ],
          },
          {
            id: "encargado",
            title: "13. Engynex como encargado",
            body: [
              "Cuando Engynex desarrolla, aloja, mantiene o soporta sitios, plataformas o productos para sus clientes, puede tratar datos personales cuyo responsable es el cliente. En esos casos, Engynex actúa como encargado: trata los datos solo para prestar el servicio contratado y según las instrucciones del cliente, adopta medidas de seguridad, guarda confidencialidad y apoya al cliente en la atención de los derechos de los titulares. Los titulares deben dirigir sus solicitudes al cliente, como responsable.",
            ],
          },
          {
            id: "seguridad",
            title: "14. Seguridad de la información",
            body: [
              "Engynex adopta medidas técnicas, humanas y administrativas razonables para proteger los datos personales contra adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento, como el control de accesos, las conexiones cifradas y las copias de seguridad. Ningún sistema es completamente infalible; si ocurre un incidente de seguridad que afecte datos personales, actuaremos para mitigarlo y lo informaremos a quien corresponda según la ley.",
            ],
          },
          {
            id: "conservacion",
            title: "15. Conservación de los datos",
            body: [
              "Conservamos los datos personales durante el tiempo necesario para cumplir las finalidades para las que fueron recolectados, mientras dure la relación con el titular y durante los plazos que exijan las normas legales, contables, tributarias y comerciales. Cumplidos esos plazos, los suprimimos o anonimizamos de forma segura.",
            ],
          },
          {
            id: "vigencia",
            title: "16. Vigencia",
            body: [
              "Esta política rige desde la fecha de última actualización indicada al inicio de este documento. Las bases de datos se conservarán mientras se mantengan las finalidades del tratamiento descritas.",
            ],
          },
          {
            id: "cambios",
            title: "17. Cambios a esta política",
            body: [
              "Cualquier cambio sustancial a esta política será comunicado oportunamente a los titulares, a más tardar al momento de implementarlo, a través del sitio web o de los datos de contacto que tengamos. Cuando el cambio se refiera a las finalidades del tratamiento, solicitaremos una nueva autorización.",
            ],
          },
        ],
      },

      /* =============================== COOKIES =============================== */
      {
        slug: "cookies",
        title: "Política de cookies",
        summary:
          "Qué guarda este sitio en tu navegador, para qué y cómo puedes controlarlo.",
        metaDescription:
          "Política de cookies y almacenamiento local del sitio de Engynex: qué se guarda, con qué finalidad y cómo gestionarlo desde tu navegador.",
        intro: [
          `Esta política explica cómo el sitio ${legalIdentity.domain}, operado por ${entity}, usa cookies y tecnologías similares de almacenamiento en tu navegador.`,
        ],
        sections: [
          {
            id: "que-son",
            title: "1. ¿Qué son las cookies?",
            body: [
              "Las cookies son pequeños archivos que un sitio web guarda en tu navegador para recordar información sobre tu visita. Existen tecnologías similares, como el almacenamiento local (localStorage), que permiten guardar preferencias en tu dispositivo. En esta política las llamamos a todas «cookies».",
            ],
          },
          {
            id: "que-usamos",
            title: "2. Qué usamos en este sitio",
            body: [
              "Clasificamos las cookies en cuatro categorías. Las necesarias siempre están activas; las demás son opcionales y solo se usan si las aceptas:",
              {
                list: [
                  "Necesarias: permiten navegar, recordar el idioma, el país y el tema que elegiste, enviar formularios de forma segura y guardar tu decisión sobre cookies. Incluyen, en el almacenamiento local de tu navegador, «theme» (modo claro u oscuro), «engynex-country» (país o región seleccionado) y «engynex-cookie-consent» (las categorías que aceptaste o rechazaste y la fecha). Se guardan solo en tu navegador, no se envían a nuestros servidores y no sirven para identificarte. Si usas el chat en vivo, se guarda además «engynex-chat», una clave aleatoria que acompaña tus mensajes para que puedas retomar la conversación; se borra al terminar el chat. Si empiezas el formulario de cotización, «engynex-lead-draft» guarda tu avance solo en este navegador para que no lo pierdas al recargar; se borra al enviarlo.",
                  "Preferencias: recuerdan ajustes opcionales para personalizar tu experiencia en próximas visitas.",
                  "Analítica: nos ayudan a entender qué páginas se visitan y cuánto se leen para mejorar el sitio. Usamos una medición propia (sin herramientas de terceros): guardamos en tu navegador «engynex-vid» (un identificador aleatorio del navegador) y, mientras dura la visita, «engynex-sid» (la sesión). Con ellos registramos la página, la fuente de llegada, el tipo de dispositivo, el país aproximado, el tiempo en la página y cuánto bajaste. No guardamos tu IP ni datos que te identifiquen por sí solos. Si después nos escribes por el formulario, ese recorrido se une a tu solicitud para atenderte mejor. Se conserva hasta 13 meses.",
                  "Marketing: permitirían medir campañas y mostrarte anuncios relevantes en otros sitios.",
                ],
              },
              "Si aceptas cookies de analítica, además de nuestra medición propia podemos usar Google Analytics (cookies «_ga»). Si aceptas cookies de marketing, podemos usar Google Ads (cookies «_gcl») y el píxel de Meta para Facebook e Instagram (cookies «_fbp» y «_fbc») para saber qué anuncios generan solicitudes; en ese caso, al enviar el formulario, Google recibe tu correo y celular cifrados (SHA-256) para atribuir la conversión. Estas herramientas solo se cargan después de tu aceptación (modo de consentimiento de Google) y sus proveedores tratan los datos según sus propias políticas. Si retiras el consentimiento, dejamos de usarlas, borramos sus cookies y borramos el recorrido de nuestra medición propia asociado a tu navegador (salvo el ya unido a una solicitud que nos enviaste). Respetamos también la señal «Do Not Track» de tu navegador para nuestra medición propia.",
              "Cuando sigues un enlace a servicios de terceros, como WhatsApp o nuestras redes sociales, esos sitios pueden usar sus propias cookies, que se rigen por sus políticas.",
            ],
          },
          {
            id: "gestionar",
            title: "3. Cómo gestionarlas",
            body: [
              "En tu primera visita te mostramos un aviso para aceptar todas las cookies, rechazar las opcionales o elegir cuáles permitir. Puedes cambiar tu decisión cuando quieras desde el enlace «Configuración de cookies» que está al pie de cada página.",
              "También puedes consultar, bloquear o eliminar las cookies y el almacenamiento local desde la configuración de tu navegador, normalmente en las secciones de privacidad o datos de sitios. Encontrarás las instrucciones en la ayuda de Chrome, Safari, Firefox, Edge y los demás navegadores.",
              "Si borras los datos del sitio, se perderán tus preferencias de tema y país y tu decisión sobre cookies, y el aviso volverá a aparecer. Bloquear las cookies necesarias puede hacer que algunas funciones no operen correctamente.",
            ],
          },
          {
            id: "datos-personales",
            title: "4. Datos personales",
            body: [
              "Si alguna cookie llegara a tratar datos personales, se aplicará nuestra [Política de Tratamiento de Datos Personales](doc:privacidad), donde también se explica cómo ejercer tus derechos.",
            ],
          },
          {
            id: "cambios",
            title: "5. Cambios a esta política",
            body: [
              "Podemos actualizar esta política cuando cambien las cookies que usamos o la normativa aplicable. La versión vigente es la publicada en esta página, con su fecha de última actualización.",
            ],
          },
          {
            id: "contacto",
            title: "6. Contacto",
            body: [`Si tienes preguntas sobre esta política, escríbenos a ${email}.`],
          },
        ],
      },

      /* ========================== AVISO DE PRIVACIDAD ========================== */
      {
        slug: "aviso-privacidad",
        title: "Aviso de privacidad",
        summary:
          "El resumen de cómo tratamos tus datos cuando nos escribes o pides una cotización.",
        metaDescription:
          "Aviso de privacidad de Engynex conforme al Decreto 1377 de 2013: responsable, finalidades, derechos del titular y cómo consultar la política completa.",
        intro: [
          `${entity}, como responsable del tratamiento, te informa que los datos personales que nos suministres a través del sitio web, los formularios, WhatsApp, el correo electrónico o el teléfono serán tratados conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).`,
        ],
        sections: [
          {
            id: "responsable",
            title: "Responsable del tratamiento",
            body: [{ list: idRows }],
          },
          {
            id: "tratamiento-finalidades",
            title: "Tratamiento y finalidades",
            body: [
              "Recolectaremos, almacenaremos, usaremos y, cuando sea necesario, transmitiremos tus datos para responder tus solicitudes de información, contacto y soporte; preparar cotizaciones y propuestas; celebrar y ejecutar contratos, facturar y cobrar; enviarte información sobre nuestros servicios y productos, de la que puedes pedir que te retiremos en cualquier momento; mejorar nuestros servicios, y cumplir obligaciones legales.",
            ],
          },
          {
            id: "derechos",
            title: "Tus derechos",
            body: [
              "Como titular puedes conocer, actualizar, rectificar y suprimir tus datos; solicitar prueba de la autorización; ser informado sobre su uso; revocar la autorización; acceder gratuitamente a tus datos, y presentar quejas ante la Superintendencia de Industria y Comercio después de agotar el trámite ante Engynex.",
            ],
          },
          {
            id: "datos-sensibles",
            title: "Datos sensibles y de menores",
            body: [
              "No solicitamos datos sensibles. Si alguna vez te preguntamos por ellos o por datos de niños, niñas y adolescentes, responder será facultativo y no estarás obligado a hacerlo.",
            ],
          },
          {
            id: "politica",
            title: "Política de tratamiento",
            body: [
              "Puedes consultar en cualquier momento nuestra [Política de Tratamiento de Datos Personales](doc:privacidad), que incluye el procedimiento y los plazos para tus consultas y reclamos. Los cambios sustanciales a la política se comunicarán por este sitio web.",
            ],
          },
          {
            id: "contacto",
            title: "Cómo contactarnos",
            body: [
              `Para ejercer tus derechos escribe a ${pEmail} con el asunto «Datos personales», o comunícate al teléfono y WhatsApp ${phone}.`,
            ],
          },
        ],
      },

      /* ============================ USO ACEPTABLE ============================ */
      {
        slug: "uso-aceptable",
        title: "Política de uso aceptable",
        summary:
          "Lo que no está permitido en el hosting, las plataformas y los productos que administramos.",
        metaDescription:
          "Política de uso aceptable de Engynex para clientes de hosting, plataformas administradas y productos de software por suscripción.",
        intro: [
          `Esta política complementa los [Términos y condiciones](doc:terminos) y aplica a los clientes de ${entity} que usan servicios de hosting, correo, nube, plataformas administradas o productos de software por suscripción, y a sus usuarios.`,
        ],
        sections: [
          {
            id: "usos-prohibidos",
            title: "1. Usos prohibidos",
            body: [
              "No está permitido usar los servicios para:",
              {
                list: [
                  "alojar, publicar o transmitir contenido ilegal, incluido cualquier material de explotación o abuso sexual de menores;",
                  "infringir derechos de autor, marcas u otros derechos de propiedad intelectual de terceros;",
                  "distribuir software malicioso, alojar sitios de suplantación (phishing) o realizar fraudes;",
                  "enviar correo masivo no solicitado (spam) o mensajes engañosos;",
                  "atacar, escanear o intentar acceder sin autorización a sistemas, redes o cuentas, propios o de terceros;",
                  "difundir contenido que incite a la violencia, al odio o a la discriminación, o que vulnere la intimidad de otras personas;",
                  "tratar datos personales sin cumplir la ley de protección de datos;",
                  "revender o ceder los servicios sin autorización escrita de Engynex.",
                ],
              },
            ],
          },
          {
            id: "uso-recursos",
            title: "2. Uso razonable de los recursos",
            body: [
              "Los recursos de cada plan (almacenamiento, transferencia, cuentas, capacidad de procesamiento) deben usarse según lo contratado y de forma que no afecte el rendimiento ni la seguridad de la infraestructura ni de otros clientes. Por ejemplo, no se permite la minería de criptomonedas ni procesos que consuman recursos de forma desproporcionada.",
            ],
          },
          {
            id: "seguridad-cliente",
            title: "3. Responsabilidades de seguridad del cliente",
            body: [
              "El cliente debe custodiar sus contraseñas y accesos, otorgar permisos solo a personas autorizadas y avisarnos de inmediato si sospecha de un acceso indebido o de un incidente de seguridad.",
            ],
          },
          {
            id: "medidas",
            title: "4. Medidas ante incumplimientos",
            body: [
              "Si detectamos un uso contrario a esta política, podremos pedir que se corrija, retirar el contenido infractor o suspender el servicio afectado. Cuando sea posible avisaremos antes; si existe un riesgo grave o inminente para la seguridad, los datos o terceros, podremos actuar de inmediato e informar después. También colaboraremos con las autoridades competentes cuando la ley lo exija.",
            ],
          },
          {
            id: "reportes",
            title: "5. Cómo reportar un abuso",
            body: [
              `Si detectas un uso indebido de un servicio administrado por Engynex, escríbenos a ${email} con la mayor información posible (dirección web, fecha y descripción).`,
            ],
          },
        ],
      },
    ];
  }

  /* ============================== ENGLISH ============================== */
  return [
    {
      slug: "terminos",
      title: "Terms and Conditions",
      summary:
        "The rules for using this site and hiring our services, plans and products.",
      metaDescription:
        "Terms and conditions for using the Engynex website and hiring development, marketing, cloud, support, hosting, equipment rental and software product services.",
      intro: [
        `These terms and conditions govern the use of the website ${legalIdentity.domain} and the hiring of the services and products offered by ${entity}. Please read them carefully: by using the site or contracting with us, you accept them.`,
      ],
      sections: [
        {
          id: "objeto",
          title: "1. Purpose and scope",
          body: [
            "Engynex is a Colombian digital development company serving clients in Colombia and Latin America. Among other things, it offers website, app and platform development; digital marketing; audiovisual production; artificial intelligence solutions; cloud services; cybersecurity; hosting and maintenance; technology support; equipment rental; and its own software products, some on a monthly subscription.",
            "These terms apply to anyone who browses the site (the “user”) and to any individual or company that hires an Engynex service or product (the “client”). Where there is a commercial proposal, formal quote, service order or contract signed with the client (the “proposal”), its specific terms prevail over these terms to the extent they differ; anything not covered there is governed by these terms.",
          ],
        },
        {
          id: "aceptacion",
          title: "2. Acceptance",
          body: [
            "Using the site means accepting these terms. Hiring a service or product also means accepting the corresponding proposal, which may be done by signature, by email, by written message or by paying the advance or the first monthly fee.",
            "If you act on behalf of a company, you represent that you are authorized to bind it. If you do not agree with these terms, please do not use the site or hire our services.",
          ],
        },
        {
          id: "definiciones",
          title: "3. Definitions",
          body: [
            {
              list: [
                "Services: the professional activities Engynex provides to the client under the proposal (development, marketing, audiovisual, cloud, support, hosting, equipment rental, among others).",
                "Products: Engynex's own software deployed for the client, either on subscription or for a one-time payment.",
                "Monthly plan or subscription: an arrangement in which the client pays a recurring fee for a service or product for the agreed term.",
                "Deliverables: the final results Engynex delivers to the client under the proposal, such as designs, custom-built source code, graphic pieces, videos or documentation.",
                "Proposal: the formal quote, service order or contract describing the scope, price, timeline and specific terms of each engagement.",
              ],
            },
          ],
        },
        {
          id: "uso-del-sitio",
          title: "4. Use of the website",
          body: [
            "Information on the site about services, products, plans and prices is general and for reference only. We strive to keep it accurate and up to date, but it may contain errors or change without notice, and it does not by itself constitute a binding offer.",
            "When using the site you agree not to:",
            {
              list: [
                "use it for unlawful purposes or in breach of these terms;",
                "attempt to gain unauthorized access to its systems, disrupt its operation or introduce malicious code;",
                "submit false information, or third-party information without their authorization, through the forms;",
                "copy, reproduce or commercially exploit its content, trademarks, text or images without prior written authorization.",
              ],
            },
            "The site may include links to third-party sites, such as WhatsApp or social networks. Engynex does not control those sites and is not responsible for their content or policies; their use is governed by each third party's terms.",
          ],
        },
        {
          id: "servicios-cotizaciones",
          title: "5. Services, quotes and proposals",
          body: [
            "Prices published on the site are “starting from” reference prices, stated in Colombian pesos and before VAT. Estimates produced by the quote tool or other site tools are indicative only.",
            "The final price, scope, timeline and terms of each service are set in the written proposal Engynex sends to the client, which includes the tax breakdown. The proposal is valid for the period stated in it.",
            "Engynex provides only what is described in the proposal. Any additional feature, piece, adjustment or activity is a change of scope and is quoted separately before it is carried out.",
            "Unless the proposal says otherwise, third-party costs are not included, such as ad spend (paid by the client directly to the relevant platform), domains, software or template licenses, stock images, payment gateways or cloud services contracted in the client's name.",
          ],
        },
        {
          id: "pagos",
          title: "6. Prices, invoicing and payments",
          body: [
            "Unless the proposal sets a different payment method:",
            {
              list: [
                "One-time projects require a 50% advance to start and the remaining 50% on delivery.",
                "Large projects are paid by milestones according to the proposal's schedule.",
                "Monthly plans are billed at the start of each month of service.",
              ],
            },
            "We accept bank transfer, PSE and card. For clients outside Colombia we can invoice in US dollars when agreed. VAT and any other applicable taxes are added to the stated amounts as required by law.",
            "Work begins once the advance or first monthly fee is received. If a payment is not received on the agreed date, Engynex may, after notifying the client, suspend the work or service until the account is brought up to date, without prejudice to any other remedies available under the law. Delivery dates are extended by the length of the suspension.",
          ],
        },
        {
          id: "suscripciones",
          title: "7. Monthly plans and subscriptions",
          body: [
            "The term and minimum commitment of each monthly plan are those stated in the published plan or the proposal, and are always put in writing before starting. Depending on the service, monthly plans are agreed for 3 or 12 months. One-time projects have no minimum term.",
            "Website subscription. Under this arrangement:",
            {
              list: [
                "There is no setup fee: the client pays a monthly fee and Engynex provides the domain, hosting, SSL certificate and maintenance for as long as the subscription is active.",
                "The minimum term is 12 months.",
                "The domain is registered in the client's name. If the client cancels the subscription, Engynex transfers the domain to them.",
                "On cancellation, the site stops being published on Engynex's infrastructure. The client may move to the one-time payment option by paying the difference for the development.",
              ],
            },
            "Software products. Engynex products may be hired on a monthly subscription with support included or for a one-time payment with the code in the client's name, as stated in the proposal.",
            "Cancellation of a plan must be requested in writing. The consequences of ending a plan before the minimum term are those set out in the proposal. Monthly fees already invoiced for periods in progress are not prorated unless the proposal provides otherwise.",
          ],
        },
        {
          id: "obligaciones-cliente",
          title: "8. Client obligations",
          body: [
            "So that we can deliver what was agreed, the client undertakes to:",
            {
              list: [
                "provide on time the information, content, access and approvals the project requires, and appoint a contact person with decision-making authority;",
                "ensure it holds the rights to the text, logos, images, videos, data and other materials it supplies, and that their use does not infringe third-party rights or the law;",
                "review progress and deliverables within the agreed timeframes;",
                "pay the agreed amounts on time;",
                "safeguard the credentials and access it receives and use the services in accordance with the law and the [Acceptable Use Policy](doc:uso-aceptable).",
              ],
            },
            "Delays caused by missing information, materials, approvals or payments for which the client is responsible extend the delivery dates by the same amount of time and are not attributable to Engynex.",
          ],
        },
        {
          id: "entrega",
          title: "9. Timelines, delivery and acceptance",
          body: [
            "Each project's timeline is the one in the proposal's schedule and starts once the advance and the information needed to begin have been received.",
            "On delivery, the client reviews the deliverable and sends any comments in writing within the period set in the proposal. Engynex fixes anything that does not match what was agreed. A deliverable is deemed accepted when the client approves it, when the review period ends without comments, or when the client puts it into production use.",
          ],
        },
        {
          id: "propiedad-intelectual",
          title: "10. Intellectual property",
          body: [
            "Custom deliverables. Once the full project price has been paid, the client holds the economic rights to the final deliverables developed specifically for it, under Colombian copyright law. Until full payment, Engynex retains those rights.",
            "Pre-existing tools. Engynex retains ownership of its pre-existing or general-purpose tools, libraries, components, templates, methodologies and know-how, even when used in the project. Where they form part of a deliverable, the client receives a non-exclusive, perpetual license to use them as part of that deliverable.",
            "Third-party components. Open-source software, fonts, stock images, plugins, APIs and other third-party components included in a deliverable are governed by their own licenses, which the client must respect.",
            "Subscription products. When an Engynex product is hired on subscription, the client receives a non-exclusive, non-transferable license to use it for the duration of the subscription, and Engynex retains the product's intellectual property. Under the one-time payment option, rights to the code are as stated in the proposal.",
            "Client data. The information and data the client uploads to or generates in the platforms we provide belong to the client.",
            "Portfolio. Engynex may mention the client and show the work done in its portfolio and marketing materials, unless the client objects in writing or the information is confidential.",
          ],
        },
        {
          id: "garantia",
          title: "11. Warranty",
          body: [
            "Every development includes a warranty on functional defects for the period stated in the plan or proposal (2 to 6 months depending on the plan), counted from delivery. During that period we fix any failure attributable to our work at no cost.",
            "The warranty does not cover:",
            {
              list: [
                "changes made by the client or third parties without Engynex's involvement;",
                "failures of third-party services, platforms, updates or infrastructure not managed by Engynex;",
                "new features or changes of scope;",
                "misuse or use contrary to the instructions provided.",
              ],
            },
            "Brand-new rental equipment is also covered by the factory warranty. None of the above limits any statutory warranty that applies when the client is a consumer (see [Consumer rights](#consumidor)).",
          ],
        },
        {
          id: "alquiler-equipos",
          title: "12. Equipment rental",
          body: [
            "When the client rents equipment (desktops, laptops, servers, monitors, printers or networking gear), the following conditions apply in addition to the proposal:",
            {
              list: [
                "The equipment is and remains Engynex's property. The client holds it for use during the agreed term, which may be days, weeks or months.",
                "Engynex offers brand-new equipment with factory warranty and certified refurbished equipment inspected by Engynex; the chosen line is stated in the proposal.",
                "The fee includes installation, scheduled preventive maintenance, support and replacement under the plan's terms. If a device fails and cannot be repaired right away, Engynex delivers a replacement unit.",
                "The client must use the equipment properly, keep it at the agreed location, not open, repair or modify it on its own, and promptly report any failure, loss or damage.",
                "Damage caused by misuse, accidents, loss or theft while the equipment is in the client's possession is handled as set out in the proposal.",
                "At the end of the rental, Engynex picks up the equipment and, before doing so, performs certified secure erasure of the drives and provides the corresponding certificate.",
              ],
            },
          ],
        },
        {
          id: "confidencialidad",
          title: "13. Confidentiality",
          body: [
            "Each party will keep confidential any confidential information it receives from the other in the course of the business relationship (technical, commercial, financial, customer or access information) and will use it only to perform what was agreed. This obligation survives the end of the relationship.",
            "Information is not confidential if it becomes public through no fault of the recipient, was already lawfully known to it, is obtained from a third party with no duty of confidentiality, or must be disclosed by order of a competent authority.",
          ],
        },
        {
          id: "datos-personales",
          title: "14. Personal data",
          body: [
            "Engynex processes personal data in accordance with Law 1581 of 2012 and its implementing regulations, as described in its [Personal Data Processing Policy](doc:privacidad).",
            "When, to provide a service, Engynex processes personal data of the client's customers, users or employees (for example, in a platform, product or hosting service), it acts as a data processor on behalf of the client, who is the data controller and must obtain the authorizations required by law.",
          ],
        },
        {
          id: "responsabilidad",
          title: "15. Limitation of liability",
          body: [
            "Engynex provides its services with professional diligence. For services whose outcome depends on external factors, such as search rankings, ad campaign performance, sales or third-party algorithms, its obligations are to use best efforts, not to achieve a specific result.",
            "Engynex is not liable for:",
            {
              list: [
                "failures, outages or changes in third-party services, such as advertising platforms, social networks, cloud providers, payment gateways, domain registrars or messaging services;",
                "content the client publishes or supplies, or the client's use of the deliverables;",
                "damage resulting from not following the security recommendations provided or from credentials poorly safeguarded by the client;",
                "lost profits or indirect damages, to the extent permitted by law.",
              ],
            },
            "To the extent permitted by law, Engynex's total liability to the client for any claim arising from a service is limited to the amount actually paid by the client for that service during the 12 months preceding the event giving rise to the claim. This limitation does not apply in cases of willful misconduct or gross negligence, and does not restrict consumers' non-waivable rights.",
          ],
        },
        {
          id: "fuerza-mayor",
          title: "16. Force majeure",
          body: [
            "Neither party is liable for non-performance or delay caused by force majeure or acts of God, such as natural disasters, widespread power or internet outages, acts of authority or large-scale cyberattacks that could not reasonably have been foreseen or resisted. The affected party will notify the other as soon as possible and deadlines will be extended for as long as the situation lasts.",
          ],
        },
        {
          id: "terminacion",
          title: "17. Termination",
          body: [
            "The relationship ends when its purpose or agreed term is fulfilled, by mutual agreement or on the grounds set out in the proposal. Either party may terminate it if the other seriously breaches its obligations and fails to remedy the breach within a reasonable period after receiving written notice.",
            "On termination, the client pays for work performed and expenses incurred up to that date, and Engynex delivers whatever has been paid for. The intellectual property, confidentiality, personal data and limitation of liability clauses survive termination.",
          ],
        },
        {
          id: "consumidor",
          title: "18. Consumer rights",
          body: [
            "When the client acquires a service or product as an end user, i.e. as a consumer, it has the rights provided in Law 1480 of 2011 (Consumer Statute), which prevail over any provision of these terms that limits them. These include:",
            {
              list: [
                "receiving clear, truthful, sufficient and timely information about the services, their prices and terms;",
                "the statutory warranty of quality, suitability and safety of goods and services;",
                "the right of withdrawal for distance or non-traditional sales, within five (5) business days after the contract is entered into, subject to the exceptions in article 47 of Law 1480 of 2011, including services whose provision has begun with the consumer's agreement and goods made to the consumer's specifications or clearly personalized;",
                "filing requests, complaints and claims with Engynex and, where applicable, with the Superintendence of Industry and Commerce (SIC).",
              ],
            },
            `You can submit requests, complaints and claims to ${email} or by phone and WhatsApp at ${phone}.`,
          ],
        },
        {
          id: "ley-aplicable",
          title: "19. Governing law and dispute resolution",
          body: [
            "These terms and the relationships they govern are subject to the laws of the Republic of Colombia.",
            "The parties will try to resolve any dispute directly and in good faith. If they cannot reach agreement, the dispute will be submitted to the competent courts of the Republic of Colombia, without prejudice to any action a consumer may bring before the Superintendence of Industry and Commerce.",
          ],
        },
        {
          id: "cambios",
          title: "20. Changes to these terms",
          body: [
            "Engynex may update these terms. The version in force is the one published on this page, with its last-updated date. Changes do not affect proposals already accepted, which are governed by the terms in force when they were accepted, unless the parties agree otherwise.",
          ],
        },
        {
          id: "contacto",
          title: "21. Contact",
          body: [
            `For any questions about these terms, write to us at ${email}, or call or message us on WhatsApp at ${phone}. Business hours: ${hours}.`,
          ],
        },
      ],
    },

    {
      slug: "privacidad",
      title: "Personal Data Processing Policy",
      summary:
        "What data we collect, what we use it for and how to exercise your rights as a data subject.",
      metaDescription:
        "Engynex personal data processing policy under Colombian Law 1581 of 2012 and Decree 1377 of 2013 (compiled in Decree 1074 of 2015).",
      intro: [
        `${entity} adopts this policy in compliance with Statutory Law 1581 of 2012, Decree 1377 of 2013 (compiled in Single Regulatory Decree 1074 of 2015) and any rules that amend or supplement them. It explains how we collect, store, use, share and delete personal data, and how you can exercise your rights.`,
      ],
      sections: [
        {
          id: "responsable",
          title: "1. Data controller",
          body: [{ list: idRows }],
        },
        {
          id: "alcance",
          title: "2. Scope",
          body: [
            "This policy applies to personal data that Engynex processes as data controller and receives through the website, its contact, quote and support forms, WhatsApp, email, phone, social networks and in the course of its relationship with clients, prospects and suppliers.",
            "When Engynex processes personal data on behalf of a client, as a data processor, the section [Engynex as data processor](#encargado) applies.",
          ],
        },
        {
          id: "definiciones",
          title: "3. Definitions",
          body: [
            "For the purposes of this policy, and in accordance with Law 1581 of 2012 and Decree 1377 of 2013:",
            {
              list: [
                "Authorization: the data subject's prior, express and informed consent to the processing of their data.",
                "Privacy notice: a verbal or written communication informing the data subject of the existence of this policy, how to access it and the purposes of the processing.",
                "Database: an organized set of personal data subject to processing.",
                "Personal data: any information linked or that may be associated with one or more identified or identifiable individuals.",
                "Sensitive data: data affecting the data subject's privacy or whose misuse may lead to discrimination, such as racial or ethnic origin, political orientation, religious beliefs, trade union membership, health, sex life and biometric data.",
                "Data processor: a person who processes personal data on behalf of the data controller.",
                "Data controller: a person who decides on the database and the processing of the data.",
                "Data subject: the individual whose personal data is processed.",
                "Processing: any operation on personal data, such as collection, storage, use, circulation or deletion.",
                "Transfer: sending personal data to a recipient who is in turn a data controller, inside or outside Colombia.",
                "Transmission: communicating personal data to a processor, inside or outside Colombia, so that it processes them on behalf of the controller.",
              ],
            },
          ],
        },
        {
          id: "principios",
          title: "4. Principles",
          body: [
            "Engynex applies the principles of legality, purpose, freedom, accuracy or quality, transparency, restricted access and circulation, security and confidentiality set out in article 4 of Law 1581 of 2012.",
          ],
        },
        {
          id: "datos-recolectados",
          title: "5. Data we collect",
          body: [
            "Depending on the channel and the relationship, we may process the following data:",
            {
              list: [
                "Identification and contact data: name, company, job title, email, phone number, city and country.",
                "Request data: service or product of interest, estimated budget, message and any files you attach in the contact, quote or support forms.",
                "Conversations: the number, profile name and messages you exchange with us via WhatsApp, email, social networks or the site's live chat (for the latter, also the name, email or mobile you leave and the page you write from).",
                "Client and supplier data: ID document or tax ID (NIT), billing details, payment information and whatever is needed to perform the contract.",
                "Browsing data: preferences the site stores in your browser (light or dark theme and country) and technical data such as IP address, browser type and pages visited, which servers log for security. If you accept analytics cookies, we also record your journey through the site with a random identifier, and if you later write to us, that journey is linked to your request. Our use of cookies is explained in the [Cookie Policy](doc:cookies).",
              ],
            },
            "Card and PSE payments are processed through the relevant payment platforms, which handle financial data under their own policies.",
          ],
        },
        {
          id: "finalidades",
          title: "6. Purposes of processing",
          body: [
            "We process personal data to:",
            {
              list: [
                "respond to information, contact and support requests;",
                "prepare quotes and commercial proposals;",
                "enter into and perform contracts, provide services, deploy products and manage invoicing, payments and collections;",
                "provide technical support and handle requests, complaints and claims;",
                "send information about Engynex services, products, news and events, from which you may ask to be removed at any time; on WhatsApp we only do so if you expressly accepted it in the form, and replying STOP is enough to stop receiving them;",
                "measure client satisfaction and improve our services;",
                "follow up on your request by email (at most three messages, which you can unsubscribe from with the link at the bottom) and, only if you authorized it, remind you of a form you left unfinished;",
                "prepare the first conversation with the help of artificial intelligence, which summarizes what you told us about your project; that reading makes no decision about you and does not change the priority our system assigns you;",
                "protect the security of the site, systems and information;",
                "produce internal statistics with aggregated or anonymized information;",
                "comply with legal, accounting and tax obligations and requests from competent authorities.",
              ],
            },
            "Engynex does not sell or rent personal data.",
          ],
        },
        {
          id: "autorizacion",
          title: "7. Authorization",
          body: [
            "Engynex requests the data subject's authorization no later than when the data is collected, stating the purposes of the processing. Authorization may be given in writing, orally or through unequivocal conduct from which it can reasonably be concluded that it was given — for example, by ticking the acceptance box on a form or by starting a WhatsApp conversation after reading the [Privacy Notice](doc:aviso-privacidad). Engynex keeps proof of the authorization.",
            "Under article 10 of Law 1581 of 2012, authorization is not required for information requested by a public or administrative entity in the exercise of its legal duties or by court order; public data; medical or health emergencies; processing authorized by law for historical, statistical or scientific purposes; and data related to the Civil Registry.",
          ],
        },
        {
          id: "derechos",
          title: "8. Data subject rights",
          body: [
            "As a data subject you have the right to:",
            {
              list: [
                "know, update and rectify your personal data, including partial, inaccurate, incomplete, fragmented or misleading data;",
                "request proof of the authorization given, except where the law does not require it;",
                "be informed, upon request, of how your data has been used;",
                "file complaints with the Superintendence of Industry and Commerce for breaches of the law, after exhausting the inquiry or claim process with Engynex;",
                "revoke the authorization and/or request deletion of your data when constitutional and legal principles, rights and guarantees are not respected. Revocation and deletion do not apply where there is a legal or contractual duty to remain in the database;",
                "access free of charge your personal data that has been processed.",
              ],
            },
            "These rights may be exercised by the data subject, their successors, their representative or attorney, and anyone designated by stipulation in favor of another.",
          ],
        },
        {
          id: "procedimiento",
          title: "9. Procedure for inquiries and claims",
          body: [
            `You can exercise your rights by writing to ${pEmail} with the subject “Personal data”, or by phone and WhatsApp at ${phone}. Your request must include your name, ID document, a description of what you are requesting and a contact method for our reply. If you act on behalf of someone else, attach the document proving your representation.`,
            "Inquiries. If you want to know what information we hold about you, we will respond within a maximum of ten (10) business days from receipt. If it is not possible to respond within that period, we will tell you the reasons for the delay and the date of our response, which will not exceed five (5) business days after the first period expires.",
            "Claims. If you believe your data should be corrected, updated or deleted, or you notice a breach of the law, you may file a claim, which will be handled as follows:",
            {
              ordered: true,
              list: [
                "The claim must include your identification, a description of the facts giving rise to it, your address or contact method and any documents you wish to rely on.",
                "If the claim is incomplete, we will ask you within five (5) business days of receipt to correct it. If two (2) months pass after our request without you providing the requested information, the claim will be deemed withdrawn.",
                "If Engynex is not competent to resolve it, it will forward it to the appropriate party within two (2) business days and inform you.",
                "Once the complete claim is received, we will add the note “claim in process” and the reason to the database within two (2) business days, and keep it until the claim is decided.",
                "The maximum period to resolve the claim is fifteen (15) business days from the day after receipt. If it is not possible to resolve it within that period, we will tell you the reasons for the delay and the date it will be resolved, which will not exceed eight (8) business days after the first period expires.",
              ],
            },
            "You may only file a complaint with the Superintendence of Industry and Commerce after exhausting the inquiry or claim process with Engynex.",
          ],
        },
        {
          id: "datos-sensibles",
          title: "10. Sensitive data",
          body: [
            "Engynex does not request sensitive data to provide its services. If it ever becomes necessary to process such data, we will explicitly tell you which data and for what purpose, request your express authorization and remind you that you are not required to authorize its processing or answer questions about it.",
          ],
        },
        {
          id: "menores",
          title: "11. Data of children and adolescents",
          body: [
            "Our services are aimed at companies and adults, and we do not intentionally collect data from minors through the site.",
            "When, in providing a service or product (for example, school platforms), Engynex processes minors' data on behalf of a client, it does so as a data processor, respecting the best interests of children and adolescents and their fundamental rights, in accordance with article 7 of Law 1581 of 2012 and its implementing rules. The client is responsible for obtaining authorization from their legal representatives.",
          ],
        },
        {
          id: "transferencias",
          title: "12. Data transmission and transfer",
          body: [
            "To operate, Engynex may transmit personal data to providers acting as processors, such as web and cloud hosting, email, messaging, management tools, payment platforms and artificial intelligence providers (for example, Anthropic, which processes the text of your request to summarize it and does not use it to train its models), located in Colombia or abroad. Terms are agreed with them so that they process the data only according to our instructions and with adequate security measures.",
            "Engynex will only transfer personal data to other countries that provide adequate levels of data protection or in the cases exempted by article 26 of Law 1581 of 2012. Data may also be provided to authorities that request it in the exercise of their legal duties.",
          ],
        },
        {
          id: "encargado",
          title: "13. Engynex as data processor",
          body: [
            "When Engynex develops, hosts, maintains or supports sites, platforms or products for its clients, it may process personal data for which the client is the controller. In those cases Engynex acts as a processor: it processes the data only to provide the contracted service and according to the client's instructions, adopts security measures, maintains confidentiality and supports the client in handling data subjects' rights. Data subjects should address their requests to the client, as controller.",
          ],
        },
        {
          id: "seguridad",
          title: "14. Information security",
          body: [
            "Engynex adopts reasonable technical, human and administrative measures to protect personal data against tampering, loss, and unauthorized or fraudulent consultation, use or access, such as access control, encrypted connections and backups. No system is completely infallible; if a security incident affecting personal data occurs, we will act to mitigate it and report it to the appropriate parties as required by law.",
          ],
        },
        {
          id: "conservacion",
          title: "15. Data retention",
          body: [
            "We keep personal data for as long as needed to fulfil the purposes for which it was collected, for the duration of the relationship with the data subject and for the periods required by legal, accounting, tax and commercial rules. Once those periods end, we securely delete or anonymize it.",
          ],
        },
        {
          id: "vigencia",
          title: "16. Effective date",
          body: [
            "This policy is effective from the last-updated date shown at the top of this document. Databases will be kept for as long as the processing purposes described remain.",
          ],
        },
        {
          id: "cambios",
          title: "17. Changes to this policy",
          body: [
            "Any substantial change to this policy will be communicated to data subjects in a timely manner, no later than when it is implemented, through the website or the contact details we hold. Where the change concerns the purposes of processing, we will request a new authorization.",
          ],
        },
      ],
    },

    {
      slug: "cookies",
      title: "Cookie Policy",
      summary:
        "What this site stores in your browser, why, and how you can control it.",
      metaDescription:
        "Cookie and local storage policy for the Engynex website: what is stored, for what purpose and how to manage it from your browser.",
      intro: [
        `This policy explains how the website ${legalIdentity.domain}, operated by ${entity}, uses cookies and similar browser storage technologies.`,
      ],
      sections: [
        {
          id: "que-son",
          title: "1. What are cookies?",
          body: [
            "Cookies are small files a website stores in your browser to remember information about your visit. Similar technologies, such as local storage (localStorage), let a site save preferences on your device. In this policy we call all of them “cookies”.",
          ],
        },
        {
          id: "que-usamos",
          title: "2. What this site uses",
          body: [
            "We group cookies into four categories. Necessary cookies are always active; the others are optional and are only used if you accept them:",
            {
              list: [
                "Necessary: they let you browse, remember the language, country and theme you chose, submit forms securely and store your cookie choice. In your browser's local storage they include “theme” (light or dark mode), “engynex-country” (selected country or region) and “engynex-cookie-consent” (the categories you accepted or rejected and the date). They are stored only in your browser, are not sent to our servers and cannot be used to identify you. If you use the live chat, “engynex-chat” is also stored: a random key sent with your messages so you can resume the conversation; it is deleted when the chat ends. If you start the quote form, “engynex-lead-draft” keeps your progress only in this browser so you don't lose it when reloading; it is deleted when you submit it.",
                "Preferences: they remember optional settings to personalize your experience on future visits.",
                "Analytics: they help us understand which pages are visited and how much they are read so we can improve the site. We use our own first-party measurement (no third-party tools): we store in your browser “engynex-vid” (a random browser identifier) and, for the length of the visit, “engynex-sid” (the session). With them we record the page, the traffic source, device type, approximate country, time on page and how far you scrolled. We do not store your IP or data that identifies you on its own. If you later write to us through the form, that journey is linked to your request so we can serve you better. It is kept for up to 13 months.",
                "Marketing: they would let us measure campaigns and show you relevant ads on other sites.",
              ],
            },
            "If you accept analytics cookies, besides our own measurement we may use Google Analytics (“_ga” cookies). If you accept marketing cookies, we may use Google Ads (“_gcl” cookies) and the Meta pixel for Facebook and Instagram (“_fbp” and “_fbc” cookies) to learn which ads generate requests; in that case, when you submit the form, Google receives your email and mobile number hashed (SHA-256) to attribute the conversion. These tools only load after you accept (Google consent mode) and their providers process data under their own policies. If you withdraw consent, we stop using them, delete their cookies and delete our own measurement journey tied to your browser (except what is already linked to a request you sent us). We also honor your browser's “Do Not Track” signal for our own measurement.",
            "When you follow a link to third-party services, such as WhatsApp or our social networks, those sites may use their own cookies, governed by their policies.",
          ],
        },
        {
          id: "gestionar",
          title: "3. How to manage them",
          body: [
            "On your first visit we show you a notice to accept all cookies, reject the optional ones or choose which to allow. You can change your choice at any time from the “Cookie settings” link at the bottom of every page.",
            "You can also view, block or delete cookies and local storage in your browser settings, usually under privacy or site data. You'll find instructions in the help pages of Chrome, Safari, Firefox, Edge and other browsers.",
            "If you clear the site's data, your theme and country preferences and your cookie choice will be lost, and the notice will appear again. Blocking necessary cookies may prevent some features from working properly.",
          ],
        },
        {
          id: "datos-personales",
          title: "4. Personal data",
          body: [
            "If any cookie were to process personal data, our [Personal Data Processing Policy](doc:privacidad) will apply; it also explains how to exercise your rights.",
          ],
        },
        {
          id: "cambios",
          title: "5. Changes to this policy",
          body: [
            "We may update this policy when the cookies we use or the applicable regulations change. The version in force is the one published on this page, with its last-updated date.",
          ],
        },
        {
          id: "contacto",
          title: "6. Contact",
          body: [`If you have questions about this policy, write to us at ${email}.`],
        },
      ],
    },

    {
      slug: "aviso-privacidad",
      title: "Privacy Notice",
      summary:
        "A summary of how we handle your data when you contact us or request a quote.",
      metaDescription:
        "Engynex privacy notice under Decree 1377 of 2013: data controller, purposes, data subject rights and how to read the full policy.",
      intro: [
        `${entity}, as data controller, informs you that the personal data you provide through the website, forms, WhatsApp, email or phone will be processed in accordance with Law 1581 of 2012 and Decree 1377 of 2013 (compiled in Decree 1074 of 2015).`,
      ],
      sections: [
        {
          id: "responsable",
          title: "Data controller",
          body: [{ list: idRows }],
        },
        {
          id: "tratamiento-finalidades",
          title: "Processing and purposes",
          body: [
            "We will collect, store, use and, when necessary, transmit your data to respond to your information, contact and support requests; prepare quotes and proposals; enter into and perform contracts, invoice and collect payment; send you information about our services and products, from which you may ask to be removed at any time; improve our services; and comply with legal obligations.",
          ],
        },
        {
          id: "derechos",
          title: "Your rights",
          body: [
            "As a data subject you may know, update, rectify and delete your data; request proof of authorization; be informed of its use; revoke the authorization; access your data free of charge; and file complaints with the Superintendence of Industry and Commerce after exhausting the process with Engynex.",
          ],
        },
        {
          id: "datos-sensibles",
          title: "Sensitive data and minors' data",
          body: [
            "We do not request sensitive data. If we ever ask about such data or about data of children and adolescents, answering will be optional and you will not be required to do so.",
          ],
        },
        {
          id: "politica",
          title: "Processing policy",
          body: [
            "You can read our [Personal Data Processing Policy](doc:privacidad) at any time; it includes the procedure and deadlines for your inquiries and claims. Substantial changes to the policy will be announced on this website.",
          ],
        },
        {
          id: "contacto",
          title: "How to contact us",
          body: [
            `To exercise your rights, write to ${pEmail} with the subject “Personal data”, or call or message us on WhatsApp at ${phone}.`,
          ],
        },
      ],
    },

    {
      slug: "uso-aceptable",
      title: "Acceptable Use Policy",
      summary:
        "What is not allowed on the hosting, platforms and products we manage.",
      metaDescription:
        "Engynex acceptable use policy for hosting, managed platform and subscription software clients.",
      intro: [
        `This policy supplements the [Terms and Conditions](doc:terminos) and applies to clients of ${entity} who use hosting, email, cloud, managed platform or subscription software services, and to their users.`,
      ],
      sections: [
        {
          id: "usos-prohibidos",
          title: "1. Prohibited uses",
          body: [
            "The services may not be used to:",
            {
              list: [
                "host, publish or transmit illegal content, including any child sexual exploitation or abuse material;",
                "infringe third-party copyrights, trademarks or other intellectual property rights;",
                "distribute malware, host phishing sites or commit fraud;",
                "send unsolicited bulk email (spam) or misleading messages;",
                "attack, scan or attempt unauthorized access to systems, networks or accounts, whether your own or third parties';",
                "spread content that incites violence, hatred or discrimination, or that violates other people's privacy;",
                "process personal data without complying with data protection law;",
                "resell or assign the services without Engynex's written authorization.",
              ],
            },
          ],
        },
        {
          id: "uso-recursos",
          title: "2. Fair use of resources",
          body: [
            "Each plan's resources (storage, bandwidth, accounts, processing capacity) must be used as contracted and in a way that does not affect the performance or security of the infrastructure or other clients. For example, cryptocurrency mining and processes that consume resources disproportionately are not allowed.",
          ],
        },
        {
          id: "seguridad-cliente",
          title: "3. Client security responsibilities",
          body: [
            "The client must safeguard its passwords and access, grant permissions only to authorized people and notify us immediately if it suspects unauthorized access or a security incident.",
          ],
        },
        {
          id: "medidas",
          title: "4. Measures for breaches",
          body: [
            "If we detect use contrary to this policy, we may ask for it to be corrected, remove the infringing content or suspend the affected service. Where possible we will give notice first; if there is a serious or imminent risk to security, data or third parties, we may act immediately and inform you afterwards. We will also cooperate with competent authorities when required by law.",
          ],
        },
        {
          id: "reportes",
          title: "5. How to report abuse",
          body: [
            `If you detect misuse of a service managed by Engynex, write to us at ${email} with as much information as possible (web address, date and description).`,
          ],
        },
      ],
    },
  ];
}

const cache: Partial<Record<Locale, LegalDoc[]>> = {};

/** Todos los documentos de un idioma, en el orden del centro legal. */
export function getLegalDocs(locale: Locale): LegalDoc[] {
  return (cache[locale] ??= buildDocs(locale));
}

export function getLegalDoc(slug: string, locale: Locale): LegalDoc | undefined {
  return getLegalDocs(locale).find((doc) => doc.slug === slug);
}
