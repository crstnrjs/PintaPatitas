import { Link } from "react-router-dom";

const secciones = [
  ["1. Quién presta el servicio", <>PintaPatitas facilita la solicitud de retratos personalizados de mascotas realizados por una artista independiente en Chile. Completa antes de publicar la identidad del proveedor: razón social o nombre legal, RUT, domicilio y un canal de contacto que atienda consultas y reclamos. Esos datos deben quedar visibles en esta sección para que sepas con quién contratas.</>],
  ["2. Cómo se forma el pedido", <>Enviar el formulario es una solicitud, no una compra confirmada ni una obligación de pago. El artista revisa la propuesta, las fotografías y la disponibilidad, y puede aceptarla o rechazarla. Si se acepta, recibirás por correo los pasos para pagar el abono. El trabajo comienza una vez confirmado ese pago. La descripción, técnica, tamaño, cantidad de mascotas y precio del retrato aceptado quedarán asociados a tu solicitud.</>],
  ["3. Precio, abono y saldo", <>El precio del retrato se informa en pesos chilenos (CLP) antes de enviar la solicitud. El sitio actualmente calcula un abono porcentual configurable y un saldo. El monto exacto del abono se comunica al aceptar el pedido; el saldo se cobra cuando la obra está terminada y antes del despacho. El pago se procesa mediante Mercado Pago y queda sujeto también a sus condiciones. El costo de envío no está incluido salvo que se indique expresamente: se cotiza según destino y se informa antes de coordinar el despacho. No pagues mediante enlaces distintos de los enviados por los canales oficiales.</>],
  ["4. Cambios, cancelaciones y devoluciones", <>Cada retrato se crea a partir de las instrucciones, referencias y fotografías que entrega el cliente. Si necesitas corregir datos o pedir un cambio, comunícate cuanto antes y antes de que avance la obra; la posibilidad de modificarla dependerá de su etapa y de lo acordado por escrito. Si el cliente cancela, el tratamiento del abono dependerá del trabajo ya realizado, de los costos efectivamente incurridos y de los derechos irrenunciables que reconoce la legislación chilena. No se entenderá que esta cláusula elimina derechos legales a retracto, garantía, reparación o devolución cuando correspondan. Si PintaPatitas o el artista no pueden realizar un pedido aceptado, se informará al cliente y se devolverán los pagos correspondientes, salvo que acuerden expresamente una alternativa permitida por ley. Para un producto defectuoso, distinto de lo ofrecido o con problemas de entrega, contacta al proveedor para gestionar una solución conforme a la ley.</>],
  ["5. Fotografías y datos personales", <>Para tramitar el pedido se solicitan nombre y apellido, correo electrónico, celular, región, comuna y dirección de despacho. También se recopilan el nombre de la mascota si se proporciona, las fotos que subas en el formulario de pedido, el estilo y formato elegido, las instrucciones del encargo y los datos necesarios para administrar pagos y entrega. Estos datos se usan para evaluar y gestionar la solicitud, comunicarse contigo, producir y despachar la obra, gestionar pagos y atender consultas. Las fotos enviadas en una solicitud se usan como referencia para ese retrato y se almacenan junto a la solicitud en los sistemas de gestión del servicio. No se usarán para publicidad o portafolio sin autorización separada. La sección de administración de contenido de la landing permite que únicamente el administrador cargue obras, pares de foto y obra, testimonios y ajustes; no es una función para que clientes suban archivos. El contenido de clientes o sus mascotas solo debe publicarse con autorización previa para ese uso; la autorización del pedido no implica autorización publicitaria. Los pagos se procesan mediante Mercado Pago; PintaPatitas no solicita ni debe almacenar los datos completos de tu tarjeta. No incluyas en las fotos ni en los campos información sensible que no sea necesaria. Puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo al contacto oficial del sitio, sujeto a obligaciones legales de conservación. Antes de publicar, identifica en esta sección los proveedores que reciben datos, los plazos de conservación y el canal real para ejercer estos derechos.</>],
  ["6. Fotografías y derechos de uso", <>Declara que tienes autorización para compartir las fotografías y que su uso para preparar el retrato no infringe derechos de terceros. Concedes al artista permiso limitado para usar las imágenes como referencia y ejecutar el encargo. Ese permiso no transfiere la propiedad de tus fotografías ni autoriza otros usos. El retrato encargado es una obra personalizada; los derechos sobre la obra y cualquier reproducción se rigen por la legislación aplicable y por los acuerdos comunicados para cada pedido. La publicación de una obra encargada, fotografías del cliente o la mascota, el nombre de la mascota, un testimonio o imágenes del proceso en la galería, comparativas, testimonios, redes sociales u otros medios promocionales requiere autorización previa, específica y separada del permiso necesario para realizar el pedido. La carga de esos materiales por el administrador no sustituye dicha autorización.</>],
  ["7. Fotografías, producción y envío", <>Para completar la solicitud se requiere al menos una fotografía. Se aceptan archivos JPG, PNG o WebP, hasta 6 fotografías y 5 MB por archivo. Procura que las imágenes tengan buena luz y permitan distinguir la cara y los rasgos relevantes. El tiempo de producción informado en el sitio es estimado y puede variar según el pedido; el plazo de transporte se suma a ese tiempo. Los cuadros se envían a Chile mediante Starken, de acuerdo con la cobertura disponible y la cotización comunicada. El cliente debe revisar que la dirección y los datos de contacto estén correctos.</>],
  ["8. Comunicaciones y disponibilidad", <>Las actualizaciones del pedido se envían a la dirección de correo indicada. Revisa también las carpetas de spam o promociones. El sitio puede requerir pausas por mantenimiento o por causas ajenas a PintaPatitas; esto no afecta los derechos que la ley reconoce al consumidor.</>],
  ["9. Legislación y consultas", <>Estos términos se interpretan conforme a las leyes de Chile, incluidas las normas de protección de los derechos de los consumidores y de protección de datos personales que resulten aplicables. Nada de lo aquí escrito limita derechos irrenunciables. Para consultas o reclamos utiliza el canal de contacto oficial indicado en el sitio. Completa aquí el correo o formulario operativo antes de publicar esta página.</>],
];

export default function Terminos() {
  return (
    <article className="mx-auto max-w-4xl px-5 pb-24 pt-16 text-tinta md:px-10 md:pt-24">
      <header className="mb-12 border-b border-tinta/15 pb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-acento">PintaPatitas · Chile</p>
        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">Términos y condiciones</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-tinta/70">
          Información para solicitar un retrato personalizado de tu mascota. Léela antes de enviar una solicitud o realizar un pago.
        </p>
        <p className="mt-4 text-sm text-tinta/60">Vigentes desde el 5 de noviembre de 2026</p>
      </header>

      <aside className="mb-10 border-l-4 border-acento bg-bruma/60 px-5 py-4 text-sm leading-6">
        <strong>Antes de publicar:</strong> reemplaza las indicaciones pendientes de las secciones 1, 5 y 9 con la identidad del proveedor, sus datos de contacto, los proveedores que procesan datos y los plazos de conservación. Esta versión refleja los datos y flujos que hoy recoge el sitio; conviene revisarla con asesoría legal en Chile.
      </aside>

      <div className="space-y-9">
        {secciones.map(([titulo, texto]) => (
          <section key={titulo} className="max-w-[70ch]">
            <h2 className="font-display text-xl font-semibold">{titulo}</h2>
            <p className="mt-3 leading-7 text-tinta/80">{texto}</p>
          </section>
        ))}
      </div>

      <div className="mt-14 border-t border-tinta/15 pt-6 text-sm text-tinta/70">
        ¿Tienes una solicitud en curso? <Link to="/catalogo" className="font-semibold text-acento underline underline-offset-4">Revisa o inicia tu pedido</Link>.
      </div>
    </article>
  );
}
