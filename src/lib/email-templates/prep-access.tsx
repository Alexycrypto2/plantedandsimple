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
  accessUrl?: string
  orderId?: string
}

const PrepAccessEmail = ({ accessUrl = '#', orderId = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your PlantedAndSimple Meal Prep System is confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're in 🌱</Heading>
        <Text style={text}>
          Your purchase of the <strong>Plant-Based Meal Prep &amp; Kitchen
          System</strong> is confirmed. Thank you for investing in calmer
          weeknights.
        </Text>
        <Button style={button} href={accessUrl}>
          Open your Meal Prep System
        </Button>
        <Text style={text}>
          Your access is being finalized right now — we'll email your personal
          access link the moment it's live. Keep this email safe; it's your
          receipt and proof of purchase.
        </Text>
        <Text style={text}>
          What's waiting for you: the 7-day planner with live protein and
          calorie totals, a one-tap grocery list grouped by aisle, kitchen
          batch-cooking mode with timers, pantry tracking, and 30 connected
          plant-based recipes.
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
  component: PrepAccessEmail,
  subject: 'Your Meal Prep System — access confirmed 🌱',
  displayName: 'Meal Prep System access',
  previewData: {
    accessUrl: 'https://primedownloads.store/prep',
    orderId: 'txn_example',
  },
} satisfies TemplateEntry

export default PrepAccessEmail

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
