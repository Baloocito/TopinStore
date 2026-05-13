import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import * as React from 'react'

interface ReceiptEmailProps {
  customerName: string
  orderNumber: string
  totalAmount: string
}

export const ReceiptEmail = ({
  customerName = 'Aventurero',
  orderNumber = 'TOPIN-XXXXXX',
  totalAmount = '0',
}: ReceiptEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>¡Oro recibido! Tu botín de Topin Store está asegurado.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Cabecera del correo */}
          <Section style={header}>
            <Heading style={h1}>¡ORO RECIBIDO!</Heading>
            <Text style={subtitle}>Tu misión ha sido confirmada.</Text>
          </Section>

          <Text style={text}>Hola {customerName},</Text>
          <Text style={text}>
            Los duendes de nuestra tesorería han confirmado tu pago. ¡Gracias
            por tu compra! Ya estamos preparando tu botín en la forja.
          </Text>

          {/* Caja de detalles de la orden */}
          <Section style={receiptBox}>
            <Text style={receiptTitle}>Comprobante de Gremio</Text>

            <Section style={row}>
              <Text style={label}>Nro. de Orden:</Text>
              <Text style={value}>{orderNumber}</Text>
            </Section>

            <Hr style={divider} />

            <Section style={row}>
              <Text style={label}>Total Pagado:</Text>
              <Text style={totalValue}>${totalAmount}</Text>
            </Section>
          </Section>

          <Text style={text}>
            Te enviaremos otro pergamino en cuanto tu paquete sea entregado a
            los mensajeros (Courier) con tu número de seguimiento.
          </Text>

          <Text style={footer}>
            Topin Store • Si tienes dudas, simplemente responde a este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ReceiptEmail

// ==========================================
// ESTILOS NEO-BRUTALISTAS PARA EMAIL
// ==========================================
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}
const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}
const header = {
  backgroundColor: '#f472b6', // toon-pink
  border: '4px solid #0f172a', // toon-border
  borderRadius: '16px',
  padding: '30px 20px',
  textAlign: 'center' as const,
  marginBottom: '32px',
  boxShadow: '6px 6px 0px 0px rgba(15,23,42,1)', // Sombra neo-brutalista
}
const h1 = {
  color: '#0f172a',
  fontSize: '36px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  margin: '0 0 10px 0',
  letterSpacing: '-1px',
}
const subtitle = {
  color: '#0f172a',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
}
const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '24px',
}
const receiptBox = {
  backgroundColor: '#ffffff',
  border: '4px solid #0f172a',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
}
const receiptTitle = {
  fontSize: '14px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  color: '#94a3b8',
  margin: '0 0 20px 0',
  letterSpacing: '1px',
}
const row = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '10px 0',
}
const label = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#475569',
  margin: '0',
}
const value = {
  fontSize: '16px',
  fontWeight: '900',
  color: '#0f172a',
  margin: '0',
  textAlign: 'right' as const,
}
const totalValue = {
  fontSize: '24px',
  fontWeight: '900',
  color: '#f59e0b', // toon-yellow
  textShadow: '1px 1px 0px rgba(15,23,42,0.2)',
  margin: '0',
  textAlign: 'right' as const,
}
const divider = {
  borderColor: '#e2e8f0',
  borderStyle: 'dashed',
  borderWidth: '2px',
  margin: '20px 0',
}
const footer = {
  color: '#64748b',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '48px',
  fontWeight: '700',
}
