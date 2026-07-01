import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  downloadUrl?: string
  orderId?: string
}

const CookbookDownloadEmail = ({ downloadUrl = '#', orderId = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your PlantedAndSimple cookbook is ready to download</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thank you for your order 🌱</Heading>
        <Text style={text}>
          Your copy of <strong>30 High-Protein Plant-Based Meals</strong> is ready.
          Click below to access your secure download page.
        </Text>
        <Button style={button} href={downloadUrl}>
          Download your cookbook
        </Button>
        <Text style={text}>
          This is a private link tied to your order. Keep this email — you can
          re-download the PDF anytime (up to 10 times).
        </Text>
        {orderId ? (
          <Text style={meta}>Order reference: {orderId}</Text>
        ) : null}
        <Hr style={hr} />
        <Text style={footer}>
          Questions? Just reply to this email or write to
          support@primedownloads.store.
        </Text>
        <Text style={footer}>— The PlantedAndSimple team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CookbookDownloadEmail,
  subject: 'Your PlantedAndSimple cookbook — download inside 🌱',
  displayName: 'Cookbook download link',
  previewData: {
    downloadUrl: 'https://primedownloads.store/thank-you?_ptxn=txn_example',
    orderId: 'txn_example',
  },
} satisfies TemplateEntry

export default CookbookDownloadEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '28px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#2E5E3B',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#2b2b2b',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: '#2E5E3B',
  color: '#FAF8F3',
  fontSize: '15px',
  borderRadius: '8px',
  padding: '14px 22px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '4px 0 24px',
}
const meta = { fontSize: '12px', color: '#7FA77A', margin: '0 0 20px' }
const hr = { borderColor: '#e8e6df', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#7d7d7d', margin: '8px 0' }