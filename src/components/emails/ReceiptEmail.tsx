import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
} from '@react-email/components'
import * as React from 'react'

interface ReceiptEmailProps {
  customerName: string
  orderNumber: string
  totalAmount: string
}

export default function ReceiptEmail({
  customerName = 'Aventurero',
  orderNumber = 'TOPIN-XXXXXX',
  totalAmount = '0',
}: ReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerText}>TOPIN STORE 🧸</Heading>
          </Section>

          <Section style={content}>
            <Text style={title}>¡Misión Cumplida, {customerName}!</Text>
            <Text style={text}>
              Tu oro ha sido recibido en las arcas del gremio y tu botín ya se
              está preparando en nuestra forja.
            </Text>

            <Section style={receiptBox}>
              <Text style={receiptLabel}>Comprobante de Gremio</Text>
              <Hr style={divider} />
              <Text style={receiptRow}>
                <strong>Nro. de Orden:</strong>{' '}
                <span style={highlight}>{orderNumber}</span>
              </Text>
              <Text style={receiptRow}>
                <strong>Total Pagado:</strong> ${totalAmount} CLP
              </Text>
            </Section>

            <Text style={text}>
              Los mercaderes enviarán tu paquete pronto. Te enviaremos otro
              pergamino cuando el botín esté en camino hacia tu zona de envío.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Topin Store SpA - Santiago, Chile</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ESTILOS NEO-BRUTALISTAS (Seguros para Email)
const main = {
  backgroundColor: '#fffdf5',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '4px solid #1e1e1e',
  borderRadius: '16px',
  boxShadow: '6px 6px 0px 0px rgba(30,30,30,1)',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
}

const header = {
  backgroundColor: '#ffde59', // toon-yellow
  borderBottom: '4px solid #1e1e1e',
  padding: '20px',
  textAlign: 'center' as const,
}

const headerText = {
  color: '#1e1e1e',
  fontSize: '24px',
  fontWeight: '900',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '-1px',
}

const content = {
  padding: '30px',
}

const title = {
  color: '#1e1e1e',
  fontSize: '20px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  marginBottom: '15px',
}

const text = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '1.5',
  fontWeight: '600',
}

const receiptBox = {
  backgroundColor: '#f8fafc',
  border: '3px solid #1e1e1e',
  borderRadius: '12px',
  padding: '20px',
  margin: '30px 0',
}

const receiptLabel = {
  color: '#9ca3af',
  fontSize: '12px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 10px 0',
}

const divider = {
  borderColor: '#e5e7eb',
  borderStyle: 'dashed',
  margin: '10px 0',
}

const receiptRow = {
  color: '#1e1e1e',
  fontSize: '16px',
  margin: '5px 0',
}

const highlight = {
  color: '#3b82f6', // toon-blue
  fontWeight: '900',
}

const footer = {
  backgroundColor: '#f8fafc',
  borderTop: '4px solid #1e1e1e',
  padding: '20px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  margin: '0',
}
