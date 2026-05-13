import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components'
import * as React from 'react'

interface ShippingEmailProps {
  customerName: string
  orderNumber: string
  courier: string
  trackingNumber: string
}

export const ShippingEmail = ({
  customerName = 'Aventurero',
  orderNumber = 'TOPIN-XXXXXX',
  courier = 'Starken',
  trackingNumber = '123456789',
}: ShippingEmailProps) => {
  // URL dinámica dependiendo del courier más común en Chile
  let trackingUrl = `https://www.google.com/search?q=tracking+${courier}+${trackingNumber}`
  if (courier.toLowerCase().includes('starken'))
    trackingUrl = `https://www.starken.cl/seguimiento?codigo=${trackingNumber}`
  if (courier.toLowerCase().includes('chilexpress'))
    trackingUrl = `https://www.chilexpress.cl/Views/Chilexpress/Estado-envio.aspx?DATA=${trackingNumber}`

  return (
    <Html>
      <Head />
      <Preview>¡Tu botín de Topin Store ya está en la carreta!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡EN CAMINO!</Heading>
          <Text style={text}>Hola {customerName},</Text>
          <Text style={text}>
            Tu misión <strong>{orderNumber}</strong> ha salido de nuestra forja
            y ha sido entregada a los mensajeros.
          </Text>

          <Section style={box}>
            <Text style={boxText}>
              <strong>Empresa de Envío:</strong> {courier}
            </Text>
            <Text style={boxText}>
              <strong>Nro. de Seguimiento:</strong> {trackingNumber}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link href={trackingUrl} style={button}>
              Rastrear mi Botín
            </Link>
          </Section>

          <Text style={footer}>
            Si tienes dudas, responde a este correo. ¡Gracias por confiar en el
            Gremio!
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ShippingEmail

// Estilos en línea (React Email los necesita así para que funcionen en Gmail/Outlook)
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}
const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}
const h1 = {
  color: '#0f172a',
  fontSize: '32px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  marginBottom: '24px',
}
const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
}
const box = {
  padding: '20px',
  backgroundColor: '#fef08a', // toon-yellow
  border: '4px solid #0f172a',
  borderRadius: '12px',
  margin: '24px 0',
}
const boxText = {
  margin: '0 0 8px 0',
  fontSize: '16px',
  color: '#0f172a',
}
const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}
const button = {
  backgroundColor: '#a3e635', // toon-lime
  border: '4px solid #0f172a',
  borderRadius: '12px',
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: '900',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  textTransform: 'uppercase' as const,
}
const footer = {
  color: '#64748b',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '48px',
}
