import * as React from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  downloadUrl?: string;
}

const FreeCookbookEmail = ({ downloadUrl = "https://primedownloads.store/free-cookbook" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your free PlantedAndSimple cookbook is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>PLANTED &amp; SIMPLE</Text>
        <Heading style={heading}>Your free cookbook is ready.</Heading>
        <Text style={text}>
          Welcome to <strong>20-Minute Plant Protein Kitchen</strong>—a practical collection of quick,
          nourishing meals designed for real weeknights.
        </Text>
        <Button style={button} href={downloadUrl}>Download the cookbook</Button>
        <Text style={text}>
          Keep this email so the recipes are always easy to find. The download page opens instantly on
          your phone, tablet, or computer.
        </Text>
        <Hr style={rule} />
        <Text style={footer}>Simple plant-based meals. Powerful nutrition.</Text>
        <Text style={footer}>— The PlantedAndSimple team</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: FreeCookbookEmail,
  subject: "Your free 20-minute plant protein cookbook",
  displayName: "Free cookbook delivery",
  previewData: { downloadUrl: "https://primedownloads.store/free-cookbook" },
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