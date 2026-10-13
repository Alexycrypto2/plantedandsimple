import * as React from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  downloadUrl?: string;
}

const FreeCookbookEmail = ({ downloadUrl = "https://plantedandsimple.com/free-cookbook" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Real ingredients, 25g+ protein, and why I stopped eating boring salads.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>PLANTED &amp; SIMPLE</Text>
        <Heading style={heading}>Your free cookbook is ready.</Heading>
        <Text style={text}>
          Your copy of <strong>20-Minute Plant Protein Kitchen</strong> is waiting for you:
        </Text>
        <Button style={button} href={downloadUrl}>Open my free cookbook</Button>
        <Text style={text}>Before you dive in, a quick confession.</Text>
        <Text style={text}>
          When I first started eating more plant-based meals, I did it all wrong. I spent an hour
          chopping vegetables I’d never heard of, choked down chalky protein powders, and ate plain
          bowls of lettuce and chickpeas — then was starving 90 minutes later.
        </Text>
        <Text style={text}>
          I almost gave up. Then I realised: high-protein plant meals don’t need expensive specialty
          foods or hours at the stove. They need a few simple building blocks you can put together
          in 20 minutes. That’s why I created PlantedAndSimple.
        </Text>
        <Text style={text}>
          <strong>Your challenge for tonight:</strong> pick just one recipe from your free guide and
          cook it. Keep this email so your cookbook is always one click away.
        </Text>
        <Hr style={rule} />
        <Text style={footer}>Simple plant-based meals. Powerful nutrition.</Text>
        <Text style={footer}>— Kamil &amp; the PlantedAndSimple team</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: FreeCookbookEmail,
  subject: "Your free 20-minute cookbook is inside (+ a quick confession)",
  displayName: "Free cookbook delivery",
  previewData: { downloadUrl: "https://plantedandsimple.com/free-cookbook" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { maxWidth: "560px", padding: "36px 28px" };
const eyebrow = { color: "#7FA77A", fontSize: "11px", fontWeight: "bold", letterSpacing: "2px", margin: "0 0 16px" };
const heading = { color: "#2E5E3B", fontFamily: "Georgia, serif", fontSize: "30px", lineHeight: "1.15", margin: "0 0 20px" };
const text = { color: "#2b2b2b", fontSize: "15px", lineHeight: "1.65", margin: "0 0 22px" };
const button = { backgroundColor: "#2E5E3B", borderRadius: "8px", color: "#FAF8F3", display: "inline-block", fontSize: "15px", fontWeight: "bold", padding: "15px 22px", textDecoration: "none", margin: "2px 0 26px" };
const rule = { borderColor: "#e8e6df", margin: "26px 0" };
const footer = { color: "#7d7d7d", fontSize: "12px", lineHeight: "1.5", margin: "6px 0" };

export default FreeCookbookEmail;