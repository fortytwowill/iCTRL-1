import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, Button, Text, Title, Group, Stack, Box, TypographyStylesProvider } from "@mantine/core";
import { TERMS_DOCUMENT_TITLE } from "@/lib/legalTerms";

export default function LegalTerms() {
  return (
    <Box style={{ minHeight: "100vh" }}>
      <Box component="header" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Group justify="space-between" align="center" maw={1200} mx="auto" px="md" py="md">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Group gap="sm">
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "var(--mantine-color-blue-filled)",
                  color: "var(--mantine-color-white)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package size={20} />
              </Box>
              <div>
                <Text size="sm" fw={500} c="dimmed">iCTRL</Text>
                <Text size="lg" fw={600}>{TERMS_DOCUMENT_TITLE}</Text>
              </div>
            </Group>
          </Link>
          <ThemeToggle />
        </Group>
      </Box>

      <Box component="main" maw={1200} mx="auto" px="md" py="xl">
        <Card withBorder padding={0}>
          <Card.Section p="xl" bg="var(--mantine-color-gray-0)">
            <Stack gap="md" maw={800}>
              <Text size="xs" fw={700} tt="uppercase" c="blue">Legal Document</Text>
              <Title order={2}>{TERMS_DOCUMENT_TITLE}</Title>
              <Text size="sm" c="dimmed" maw={600}>
                Review the terms governing your use of iCTRL.
              </Text>
            </Stack>
          </Card.Section>

          <Card.Section p="xl" style={{ maxHeight: "68vh", overflowY: "auto" }}>
            <TypographyStylesProvider>
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using iCTRL ("the Software"), you agree to be bound by these Terms and Conditions.
                If you do not agree to these terms, do not use the Software.
              </p>

              <h2>2. License</h2>
              <p>
                iCTRL is released under the MIT License. You are free to use, copy, modify, merge, publish,
                distribute, sublicense, and/or sell copies of the Software, subject to the conditions of the MIT License.
              </p>

              <h2>3. Self-Hosting Responsibility</h2>
              <p>
                iCTRL is designed to be self-hosted. You are responsible for the security, maintenance, backups,
                and compliance of your own deployment. The iCTRL contributors provide no warranty regarding
                the operation of your instance.
              </p>

              <h2>4. Data Privacy</h2>
              <p>
                All data stored in your iCTRL instance remains under your control. The Software does not transmit
                operational data to external servers unless you explicitly configure third-party integrations.
              </p>

              <h2>5. Disclaimer of Warranty</h2>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
                BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
                NONINFRINGEMENT.
              </p>

              <h2>6. Limitation of Liability</h2>
              <p>
                IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
                CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </p>

              <h2>7. Contact</h2>
              <p>
                For questions about these terms, please open an issue on the iCTRL GitHub repository.
              </p>
            </TypographyStylesProvider>
          </Card.Section>
        </Card>
      </Box>

      <Box
        component="footer"
        style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        px="xl"
        py="md"
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text size="xs" c="dimmed">
            This page is read-only. For inquiries, open an issue on GitHub.
          </Text>
          <Button variant="outline" component={Link} to="/login?mode=signin">
            Back to Sign In
          </Button>
        </Group>
      </Box>
    </Box>
  );
}