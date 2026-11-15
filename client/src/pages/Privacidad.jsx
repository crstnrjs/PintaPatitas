import { Link } from "react-router-dom";

// Política de privacidad. Describe el tratamiento REAL de los datos según el código
// (server/src/routes/pedidos.js, lib/ventasCuadros.js, lib/mailer.js, lib/conservacion.js).
// Si cambia qué se recopila, quién lo recibe o cuánto se conserva, actualiza este texto y la fecha.
export const PRIVACIDAD_VIGENCIA = "15 de noviembre de 2026";

const SOPORTE = <a href="mailto:soporte@pintapatitas.com">soporte@pintapatitas.com</a>;

const terceros = [
  ["Supabase", "Base de datos, almacenamiento de las fotografías y acceso al panel de administración.", "Todos los datos del pedido o compra y las fotografías."],
  ["Hostinger", "Alojamiento del sitio y de su servidor, y envío de los correos del pedido.", "Los datos que pasan por el sitio y el contenido de los correos."],
  ["Mercado Pago", "Procesar los pagos.", "Nombre, correo, monto y datos del pago. Los datos de tu tarjeta los recibe solo Mercado Pago."],
  ["Starken", "Transportar el cuadro.", "Nombre, RUT, celular, correo, dirección o sucursal, comuna y región."],
  ["La artista", "Evaluar y elaborar el encargo y despacharlo.", "Los datos del pedido y las fotografías, por el panel y por correo."],
  ["Google (Gmail) y Meta (WhatsApp, Instagram)", "Solo si nos escribes por esos canales.", "Lo que tú nos envíes por ese medio."],
];

const secciones = [
  [
    "1. Quién es responsable de tus datos",
    <>
      <p>
        El responsable del tratamiento de los datos personales que se recogen en pintapatitas.com es{" "}
        <strong>Christian Andrés Rojas Rodrigo</strong>, RUT 19.159.730-3, con domicilio en Cardenal José María Caro
        #1464, Coquimbo, Región de Coquimbo, quien administra el sitio. La artista, Fernanda Valentina Ríos Rojas,
        accede a los datos de cada pedido para evaluarlo, elaborarlo y despacharlo.
      </p>
      <p>Para cualquier consulta sobre tus datos escríbenos a {SOPORTE}.</p>
    </>,
  ],
  [
    "2. Qué datos recopilamos",
    <>
      <p>
        <strong>Al pedir un retrato:</strong> nombre, apellido, correo, celular, RUT, región, comuna y, según la entrega
        que elijas, calle, número y departamento o la sucursal Starken; el estilo, el tamaño, la cantidad de mascotas,
        sus nombres (opcional), lo que nos cuentes en "tu idea" y las fotografías que subas.
      </p>
      <p>
        <strong>Al comprar un cuadro listo:</strong> nombre y apellido, RUT, correo, celular, región, comuna y dirección o
        sucursal Starken.
      </p>
      <p>
        <strong>En los pagos:</strong> el número de la operación, el monto y su estado, que nos informa Mercado Pago. No
        recibimos ni guardamos los datos de tu tarjeta.
      </p>
      <p>
        <strong>En el formulario de soporte:</strong> nombre, correo, celular (opcional), número de pedido (opcional) y tu
        mensaje. Estos datos no se guardan en nuestra base: llegan por correo a nuestro buzón de soporte.
      </p>
      <p>
        <strong>Al navegar:</strong> como en cualquier sitio, nuestros proveedores de alojamiento y base de datos procesan
        datos técnicos como tu dirección IP para entregar las páginas y proteger el servicio. No usamos herramientas de
        analítica ni de publicidad.
      </p>
    </>,
  ],
  [
    "3. Para qué los usamos",
    <>
      <ul>
        <li>
          <strong>Gestionar tu pedido o compra</strong>: evaluarlo, elaborar el retrato, cobrar, despacharlo y avisarte
          por correo de cada paso. Es necesario para cumplir el contrato que celebras con nosotros.
        </li>
        <li>
          <strong>Responder tus consultas y reclamos</strong>, y gestionar la garantía, el derecho a retracto o las
          devoluciones.
        </li>
        <li>
          <strong>Cumplir obligaciones legales</strong> y conservar el respaldo de las operaciones realizadas.
        </li>
        <li>
          <strong>Proteger el sitio</strong> frente a abusos, por ejemplo limitando los envíos repetidos de formularios.
        </li>
        <li>
          <strong>Publicar tu retrato, tus fotos o un testimonio</strong>: solo si nos das una autorización expresa y
          separada. Nunca lo hacemos por el solo hecho de que encargues un retrato.
        </li>
      </ul>
      <p>No vendemos tus datos ni los usamos para enviarte publicidad.</p>
    </>,
  ],
  [
    "4. Con quién los compartimos",
    <>
      <p>Solo con quienes necesitamos para prestar el servicio:</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-tinta/15 text-tinta">
              <th className="py-2 pr-4 font-semibold">Quién</th>
              <th className="py-2 pr-4 font-semibold">Para qué</th>
              <th className="py-2 font-semibold">Qué datos</th>
            </tr>
          </thead>
          <tbody>
            {terceros.map(([quien, para, que]) => (
              <tr key={quien} className="border-b border-tinta/10 align-top">
                <td className="py-2 pr-4 font-medium text-tinta">{quien}</td>
                <td className="py-2 pr-4">{para}</td>
                <td className="py-2">{que}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Cada uno trata los datos según sus propias condiciones y políticas de privacidad.</p>
    </>,
  ],
  [
    "5. Transferencias fuera de Chile",
    <>
    <p>
      Algunos de estos proveedores (por ejemplo Supabase, Hostinger, Google y Meta) pueden almacenar o procesar los datos
      en servidores ubicados fuera de Chile. Los usamos porque son necesarios para operar el sitio, y elegimos
      proveedores que declaran aplicar medidas de seguridad reconocidas.
    </p>
    </>,
  ],
  [
    "6. Cuánto tiempo los conservamos",
    <>
      <p>
        Los datos y fotografías de cada pedido o compra se conservan durante <strong>6 meses</strong> desde la fecha de la
        solicitud o compra. Pasado ese plazo, el sistema elimina automáticamente las fotografías y los datos de contacto y
        envío de los pedidos finalizados, rechazados o no pagados. Los pedidos que aún están en elaboración se conservan
        hasta su término.
      </p>
      <p>
        Como respaldo de las operaciones conservamos el número de pedido, las fechas, el producto, los montos y el número
        de seguimiento del envío.
      </p>
      <p>
        <strong>Copias en correos:</strong> los correos del pedido (incluido el que recibe la artista con las fotografías
        adjuntas) y los del formulario de soporte quedan en los buzones de correo y no se borran automáticamente. Puedes
        pedirnos que los eliminemos escribiendo a {SOPORTE}.
      </p>
    </>,
  ],
  [
    "7. Fotografías",
    <>
    <p>
      Usamos las fotografías solo como referencia para pintar tu retrato. Te pedimos que subas fotos{" "}
      <strong>de tu mascota</strong>, evitando que aparezcan personas, especialmente menores de edad, o datos como
      direcciones o patentes. Si aparece una persona, declaras contar con su autorización. Al subir las fotos desde el
      sitio, tu navegador las convierte a un formato liviano que elimina los datos de ubicación que pudiera tener el
      archivo. Las fotografías se guardan en un almacenamiento privado y solo se muestran a la administración y a la
      artista.
    </p>
    </>,
  ],
  [
    "8. Cookies y almacenamiento en tu navegador",
    <>
    <p>
      El sitio público no usa cookies de seguimiento, analítica ni publicidad. Solo el panel de administración guarda en
      el navegador los datos de la sesión de quien administra el sitio. Al pagar, Mercado Pago aplica sus propias
      cookies en su página.
    </p>
    </>,
  ],
  [
    "9. Cómo protegemos tus datos",
    <>
    <p>
      Las fotografías se guardan en un almacenamiento privado y se muestran mediante enlaces temporales; el panel de
      administración exige inicio de sesión y permisos de administrador; los precios y pagos se validan en el servidor;
      y las credenciales de la cuenta de Mercado Pago que recibe los pagos se guardan cifradas. Si ocurriera un incidente de seguridad que afecte tus datos, te
      informaremos conforme a la ley.
    </p>
    </>,
  ],
  [
    "10. Tus derechos",
    <>
      <p>
        Puedes solicitar en cualquier momento el <strong>acceso</strong> a tus datos, su <strong>rectificación</strong>,{" "}
        <strong>supresión</strong>, <strong>portabilidad</strong> o el <strong>bloqueo</strong> temporal de su
        tratamiento, y <strong>oponerte</strong> a usos que no sean necesarios para tu pedido. Escríbenos a {SOPORTE} o
        a través del formulario de <Link to="/soporte">Soporte</Link>, indicando tu nombre y, si lo tienes, tu número de
        pedido. Podemos pedirte que confirmes tu identidad. Responderemos dentro de los plazos que establece la ley.
      </p>
      <p>
        Algunos datos pueden mantenerse aunque pidas su eliminación cuando sea necesario para cumplir obligaciones legales,
        resolver controversias o acreditar las operaciones realizadas. Si no quedas conforme con nuestra respuesta,
        puedes recurrir a la autoridad de protección de datos personales que corresponda.
      </p>
    </>,
  ],
  [
    "11. Menores de edad",
    <>
    <p>
      Las compras y encargos deben realizarlos personas mayores de 18 años. No recopilamos a sabiendas datos de menores
      de edad.
    </p>
    </>,
  ],
  [
    "12. Cambios a esta política",
    <>
    <p>
      Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha de vigencia. Esta política se
      complementa con los <Link to="/terminos">Términos y condiciones</Link>.
    </p>
    </>,
  ],
];

export default function Privacidad() {
  return (
    <article className="mx-auto max-w-4xl px-5 pb-24 pt-16 text-tinta md:px-10 md:pt-24">
      <header className="mb-12 border-b border-tinta/15 pb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-acento">PintaPatitas · Chile</p>
        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">Política de privacidad</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-tinta/70">
          Qué datos recopilamos cuando pides un retrato, compras un cuadro o nos escribes, para qué los usamos, con quién
          los compartimos y cómo puedes ejercer tus derechos.
        </p>
        <p className="mt-4 text-sm text-tinta/60">Vigente desde el {PRIVACIDAD_VIGENCIA}</p>
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
        ¿Quieres ejercer tus derechos o tienes dudas? Escríbenos a{" "}
        <a href="mailto:soporte@pintapatitas.com" className="font-semibold text-acento underline underline-offset-4">
          soporte@pintapatitas.com
        </a>
        .
      </div>
    </article>
  );
}
