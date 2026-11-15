import { Link } from "react-router-dom";

const secciones = [
  [
    "1. Quién presta el servicio",
    <>
      <p>
        PintaPatitas es una plataforma digital de intermediación que facilita
        la solicitud, coordinación y seguimiento de encargos de retratos
        personalizados de mascotas, y la venta de cuadros ya terminados,
        realizados por una artista independiente en Chile.
      </p>

      <p>
        <strong>Artista y proveedora del servicio:</strong> Fernanda Valentina
        Ríos Rojas es la responsable de evaluar y aceptar o rechazar las
        solicitudes de encargos, elaborar los retratos personalizados y recibir
        los pagos correspondientes. Los precios se calculan automáticamente
        según el estilo artístico, tamaño y cantidad de mascotas seleccionados
        por el cliente.
      </p>

      <p>
        <strong>Responsable del sitio web:</strong> la plataforma es
        administrada por Christian Andrés Rojas Rodrigo, RUT 19.159.730-3, con
        domicilio en Cardenal José María Caro #1464, Coquimbo, Región de
        Coquimbo. Actúa como persona natural y se encarga del funcionamiento,
        mantenimiento, gestión tecnológica y control del sitio, y de la
        administración del canal digital de atención y coordinación entre
        clientes y artista.
      </p>

      <p>
        <strong>Proceso de solicitud y aceptación:</strong> el envío de una
        solicitud no garantiza la aceptación del encargo ni genera un cobro
        automático. Cada solicitud es revisada por la artista, quien podrá
        aceptarla o rechazarla. El precio calculado por el sistema queda
        fijado al momento de enviar la solicitud y no podrá ser modificado
        posteriormente. Si el encargo es aceptado, el cliente recibirá un
        correo electrónico con un enlace de pago mediante Mercado Pago.
        Si la solicitud es rechazada, se notificará al cliente por correo
        electrónico y no se generará ningún enlace de pago ni se realizará
        cobro alguno.
      </p>

      <p>
        <strong>Modelo de intermediación:</strong> PintaPatitas recibe una
        comisión equivalente al 7 % del valor del cuadro vendido, excluyendo
        los gastos de despacho. Esta comisión corresponde a un acuerdo
        comercial entre el administrador de la plataforma y la artista,
        como retribución por los servicios de intermediación y administración
        tecnológica, y no representa un cobro adicional para el cliente.
      </p>

      <p>
        La elaboración artística de los retratos corresponde a la artista,
        sin perjuicio de las obligaciones y responsabilidades que correspondan
        a PintaPatitas por su función como administradora y operadora de la
        plataforma, de acuerdo con la normativa vigente.
      </p>

      <p>
        <strong>Contacto de PintaPatitas:</strong>{" "}
        <a href="mailto:soporte@pintapatitas.com">
          soporte@pintapatitas.com
        </a>
      </p>
    </>
  ],

  ["2. Cómo se forma el pedido", <>Para enviar una solicitud debes aceptar estos términos, incluida la exclusión del derecho a retracto de la sección 5. Al enviarla recibirás por correo un resumen de tu solicitud con un enlace a estos términos. Enviar el formulario es una solicitud, no una compra confirmada ni una obligación de pago. La artista revisa la propuesta, las fotografías y la disponibilidad, y puede aceptarla o rechazarla. Si se acepta, recibirás por correo los pasos para pagar el abono. El trabajo comienza una vez confirmado ese pago. La descripción, técnica, tamaño, cantidad de mascotas y precio del retrato aceptado quedarán asociados a tu solicitud.</>],

  ["3. Precio, abono y saldo", <>El precio del retrato se informa en pesos chilenos (CLP) antes de enviar la solicitud. El pago se divide en un abono, que es un porcentaje del precio, y un saldo. El monto exacto del abono se comunica al aceptar el pedido; el saldo se cobra cuando la obra está terminada y antes del despacho. El pago se procesa mediante Mercado Pago y queda sujeto también a sus condiciones. El envío no está incluido en el precio: se despacha por Starken con la modalidad «por pagar», es decir, pagas su costo directamente a Starken al recibir el cuadro en tu domicilio o al retirarlo en la sucursal que elijas. No pagues mediante enlaces distintos de los enviados por los canales oficiales.</>],

  ["4. Cuadros listos",
    <>
      <p>
        En la sección «Cuadros listos» se venden obras ya terminadas, con una sola unidad disponible por obra. Estas compras no requieren solicitud ni aprobación previa: se pagan en un solo pago por el precio total publicado, mediante Mercado Pago. Para comprar debes aceptar estos términos. Al iniciar la compra, el cuadro queda reservado durante 20 minutos para que completes el pago; si no se completa en ese plazo, la reserva se libera y la obra vuelve a estar disponible. Si por un problema técnico se recibe más de un pago por la misma obra, se devolverá el pago a quien no la obtenga y se le avisará por correo. El envío se realiza por Starken con la modalidad «por pagar», igual que en los retratos. Al confirmarse el pago recibirás por correo la confirmación de tu compra con un enlace a estos términos, y al despacharlo, un correo con el número de seguimiento de Starken.
      </p>
      <p>
        <strong>Derecho a retracto:</strong> como los cuadros listos no son obras personalizadas, tienes derecho a retracto conforme al artículo 3 bis, letra b), de la Ley N° 19.496: puedes arrepentirte de la compra, sin expresar causa, dentro de los <strong>10 días siguientes a la recepción del cuadro</strong>. Para ejercerlo, escríbenos a <a href="mailto:soporte@pintapatitas.com">soporte@pintapatitas.com</a> o a través del formulario de <Link to="/soporte">Soporte</Link> indicando tu número de compra. Te indicaremos cómo devolverlo por Starken; <strong>el costo del envío de devolución es de cargo del comprador</strong>, igual que el envío original. El cuadro debe devolverse sin daños atribuibles al comprador y, en lo posible, con su embalaje original. Recibida la devolución, te reembolsaremos el precio pagado a través de Mercado Pago, en el plazo que establece la ley.
      </p>
      <p>
        <strong>Daños en el transporte y garantía:</strong> te recomendamos revisar el cuadro al recibirlo y, si notas algún daño, escribirnos cuanto antes con fotos del cuadro y del embalaje. Esto no limita tu garantía legal: si el cuadro llega con defectos o dañado, dentro de los 6 meses siguientes a su recepción puedes elegir entre su reparación, su cambio, cuando sea posible tratándose de una obra única, o la devolución de lo pagado, conforme a la ley.
      </p>
    </>
  ],

  ["5. Derecho a retracto, cambios, cancelaciones y devoluciones",
    <>
      <p>
        <strong>Retratos personalizados: sin derecho a retracto.</strong> Cada retrato (incluidos los cuadros de meme) se confecciona especialmente conforme a las especificaciones del cliente: la técnica, el tamaño, la cantidad de mascotas, las fotografías de referencia y las indicaciones entregadas en la solicitud. Por eso, de acuerdo con el artículo 3 bis, letra b), de la Ley N° 19.496 y su reglamento de exclusiones, <strong>en los retratos personalizados no aplica el derecho a retracto</strong>: una vez pagado el abono no es posible terminar el contrato sin expresión de causa. Esta exclusión se informa antes de enviar la solicitud y antes de pagar, y debes aceptarla para continuar.
      </p>
      <p>
        La exclusión no se aplica si el retrato no cumple las especificaciones acordadas (por ejemplo, otra técnica, otro tamaño u otra cantidad de mascotas). Tampoco afecta la <strong>garantía legal</strong>: si el cuadro llega con defectos, dañado o no corresponde a lo solicitado, tienes derecho, dentro de los 6 meses siguientes a su recepción, a elegir entre su reparación, su cambio o la devolución de lo pagado, conforme a la ley. La interpretación artística propia de una obra pintada (trazos, texturas y tonos aproximados a los de la fotografía) no constituye por sí sola un incumplimiento de las especificaciones.
      </p>
      <p>
        <strong>Cuadros listos:</strong> no son obras personalizadas, por lo que en su compra se mantiene el derecho a retracto de 10 días desde la recepción, en los términos descritos en la sección 4.
      </p>
      <p>
        <strong>Cambios y cancelaciones:</strong> si necesitas corregir datos o pedir un cambio, comunícate cuanto antes y antes de que avance la obra; la posibilidad de modificarla dependerá de su etapa y de lo acordado por escrito. Si el cliente cancela, el tratamiento del abono dependerá del trabajo ya realizado, de los costos efectivamente incurridos y de los derechos irrenunciables que reconoce la legislación chilena. Si PintaPatitas o la artista no pueden realizar un pedido aceptado, se informará al cliente y se devolverán los pagos correspondientes, salvo que acuerden expresamente una alternativa permitida por ley. Para un producto defectuoso, distinto de lo ofrecido o con problemas de entrega, escríbenos a <a href="mailto:soporte@pintapatitas.com">soporte@pintapatitas.com</a> para gestionar una solución conforme a la ley.
      </p>
    </>
  ],

  ["6. Fotografías y datos personales",
    <>
      <p>
        Para gestionar tu pedido, PintaPatitas recopila los siguientes datos: nombre, apellido, correo electrónico, celular, RUT, región, comuna y, según la entrega que elijas, calle, número y, opcionalmente, departamento o casa, o bien la sucursal Starken donde retirarás el cuadro. En los retratos también se recopilan las fotografías de las mascotas proporcionadas para la elaboración del retrato y la información necesaria para gestionar y completar el pedido.
      </p>
      <p>
        Los datos personales y las fotografías proporcionadas se almacenan en sistemas de gestión de datos administrados mediante Supabase, y la artista recibe una copia por correo electrónico para preparar el encargo. Esta información se utiliza exclusivamente para gestionar el pedido, comunicarnos contigo, elaborar el retrato, coordinar su entrega y mantener un registro necesario para la prestación del servicio. También los reciben, en lo necesario, Mercado Pago (pagos), Starken (despacho) y nuestros proveedores de alojamiento y correo; el detalle está en la <Link to="/privacidad">Política de privacidad</Link>.
      </p>
      <p>
        Las fotografías enviadas se utilizan únicamente como referencia para realizar el retrato y no serán publicadas en redes sociales, portafolio, publicidad u otros medios sin una autorización expresa y separada por parte del cliente.
      </p>
      <p>
        El proceso de pago se realiza mediante Mercado Pago. PintaPatitas no solicita ni almacena los datos completos de las tarjetas utilizadas para efectuar el pago, siendo dicho proceso gestionado por la plataforma de Mercado Pago.
      </p>
      <p>
        Los datos personales y las fotografías se conservan durante 6 meses desde la fecha de la solicitud o compra. Pasado ese plazo, el sistema elimina de forma automática las fotografías y los datos de contacto y envío de los pedidos finalizados, rechazados o no pagados; solo se conservan el número de pedido, las fechas, el producto, los montos y el número de seguimiento del envío, como respaldo de las operaciones realizadas. Los pedidos que aún estén en elaboración se conservan hasta su término. Las copias de los correos del pedido (incluido el que recibe la artista con las fotografías adjuntas) quedan en los buzones de correo y no se borran automáticamente; puedes pedir su eliminación.
      </p>
      <p>
        Si deseas ejercer tus derechos de acceso, rectificación, supresión, oposición, portabilidad o bloqueo (ver la <Link to="/privacidad">Política de privacidad</Link>), puedes comunicarte con PintaPatitas a través de <a href="mailto:soporte@pintapatitas.com">soporte@pintapatitas.com</a>. Las solicitudes estarán sujetas a las obligaciones legales aplicables y a aquellos datos que resulte necesario conservar para cumplir obligaciones legales, resolver controversias o acreditar las operaciones realizadas.
      </p>
    </>
  ],

  ["7. Fotografías y derechos de uso", <>Declaras que tienes autorización para compartir las fotografías y que su uso para preparar el retrato no infringe derechos de terceros. Concedes a la artista permiso limitado para usar las imágenes como referencia y ejecutar el encargo. Ese permiso no transfiere la propiedad de tus fotografías ni autoriza otros usos. El retrato encargado es una obra personalizada; los derechos sobre la obra y cualquier reproducción se rigen por la legislación aplicable y por los acuerdos comunicados para cada pedido. La publicación de una obra encargada, fotografías del cliente o la mascota, el nombre de la mascota, un testimonio o imágenes del proceso en la galería, comparativas, redes sociales u otros medios promocionales requiere autorización previa, específica y separada del permiso necesario para realizar el pedido. La carga de esos materiales por el administrador no sustituye dicha autorización.</>],

  ["8. Fotografías, producción y envío", <>Para completar la solicitud se requiere al menos una fotografía. Se aceptan archivos JPG, PNG o WebP, hasta 6 fotografías y 20 MB por archivo. Procura que las imágenes tengan buena luz y permitan distinguir la cara y los rasgos relevantes. El tiempo de producción informado en el sitio es estimado y puede variar según el pedido; el plazo de transporte se suma a ese tiempo. Los cuadros se envían dentro de Chile mediante Starken, de acuerdo con su cobertura, a domicilio o a la sucursal que elijas, y el costo del envío lo pagas a Starken al recibir. Al despachar el cuadro te enviaremos por correo el número de seguimiento de Starken. El cliente debe revisar que la dirección o sucursal y los datos de contacto estén correctos.</>],

  ["9. Comunicaciones y disponibilidad", <>Las actualizaciones del pedido se envían a la dirección de correo indicada. Revisa también las carpetas de spam o promociones. El sitio puede requerir pausas por mantenimiento o por causas ajenas a PintaPatitas; esto no afecta los derechos que la ley reconoce al consumidor.</>],

  ["10. Legislación y consultas",
    <>
      <p>
        Estos términos y condiciones se interpretan y rigen conforme a las leyes de la República de Chile, incluyendo las disposiciones aplicables en materia de protección de los derechos de los consumidores y protección de datos personales. Ninguna disposición de estos términos podrá interpretarse como una limitación de los derechos que la legislación chilena reconoce como irrenunciables a los consumidores.
      </p>
      <p>
        Si tienes consultas, inconvenientes con tu pedido, problemas relacionados con los pagos, envíos o cualquier otro aspecto del servicio, puedes comunicarte con PintaPatitas a través de los siguientes canales:
      </p>
      <ul>
        <li>
          <strong>Formulario de soporte:</strong> disponible en la sección <Link to="/soporte">Soporte</Link> de nuestro sitio web. Allí podrás ingresar tu nombre, correo electrónico, celular (opcional), número de pedido o compra (opcional) y el motivo de tu consulta. Los mensajes enviados mediante este formulario serán recibidos directamente por nuestro equipo de soporte.
        </li>
        <li>
          <strong>Correo electrónico:</strong>{" "}
          <a href="mailto:soporte@pintapatitas.com">soporte@pintapatitas.com</a>.
        </li>
      </ul>
      <p>
        PintaPatitas atenderá las consultas y reclamos recibidos a través de estos canales, procurando entregar una respuesta y solución según corresponda y conforme a la normativa vigente.
      </p>
    </>
  ],
];

export default function Terminos() {
  return (
    <article className="mx-auto max-w-4xl px-5 pb-24 pt-16 text-tinta md:px-10 md:pt-24">
      <header className="mb-12 border-b border-tinta/15 pb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-acento">PintaPatitas · Chile</p>
        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">Términos y condiciones</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-tinta/70">
          Información para solicitar un retrato personalizado de tu mascota o comprar un cuadro listo. Léela antes de enviar una solicitud o realizar un pago.
        </p>
        <p className="mt-4 text-sm text-tinta/60">Vigentes desde el 15 de noviembre de 2026</p>
      </header>

      <div className="space-y-9">
        {secciones.map(([titulo, texto]) => (
          <section key={titulo} className="max-w-[70ch]">
            <h2 className="font-display text-xl font-semibold">{titulo}</h2>
            <div className="mt-3 space-y-4 leading-7 text-tinta/80 [&_a]:font-medium [&_a]:text-acento [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-tinta [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
              {texto}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 border-t border-tinta/15 pt-6 text-sm text-tinta/70">
        ¿Tienes una solicitud en curso? <Link to="/catalogo" className="font-semibold text-acento underline underline-offset-4">Revisa o inicia tu pedido</Link>.
      </div>
    </article>
  );
}
