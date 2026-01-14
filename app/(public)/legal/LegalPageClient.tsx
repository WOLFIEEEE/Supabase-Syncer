'use client';

import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Divider,
    Card,
    CardBody,
    UnorderedList,
    ListItem,
    Badge,
    Flex,
    Icon
} from '@chakra-ui/react';

const ShieldIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const InfoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

export default function LegalPageClient() {
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Container maxW="4xl" py={{ base: 10, md: 16 }}>
            <VStack spacing={8} align="stretch">

                {/* Header Section */}
                <Box textAlign="center" mb={4}>
                    <Flex justify="center" mb={4} color="brand.400">
                        <Icon as={ShieldIcon} boxSize={12} />
                    </Flex>
                    <Heading as="h1" size="2xl" mb={4} color="white">
                        Legal Notice & Disclaimers
                    </Heading>
                    <Text color="surface.400" fontSize="lg">
                        Last Updated: {lastUpdated}
                    </Text>
                </Box>

                {/* Critical Disclaimer - Prominent */}
                <Card
                    bg="surface.800"
                    borderColor="orange.400"
                    borderWidth="1px"
                    boxShadow="lg"
                    overflow="hidden"
                >
                    <Box bg="orange.500" h="4px" />
                    <CardBody py={8} px={{ base: 6, md: 10 }}>
                        <Flex align="start" gap={4} direction={{ base: "column", sm: "row" }}>
                            <Box color="orange.400" minW="24px" pt={1}>
                                <Icon as={InfoIcon} boxSize={6} />
                            </Box>
                            <Box>
                                <Heading as="h2" size="md" mb={3} color="white">
                                    Not Affiliated with Supabase
                                </Heading>
                                <Text color="surface.200" fontSize="md" lineHeight="tall">
                                    <strong>Suparbase</strong> is an independent project created and maintained by an individual developer.
                                    It is <strong>NOT</strong> affiliated, associated, authorized, endorsed by, or in any way officially connected with <strong>Supabase Inc.</strong>, or any of its subsidiaries or its affiliates.
                                </Text>
                                <Text color="surface.200" fontSize="md" mt={4} lineHeight="tall">
                                    The official Supabase website can be found at <Text as="a" href="https://supabase.com" color="brand.400" textDecoration="underline" target="_blank" rel="noopener noreferrer">https://supabase.com</Text>.
                                    The name "Supabase" as well as related names, marks, emblems, and images are registered trademarks of their respective owners. We use the name solely for descriptive purposes to indicate compatibility with the Supabase platform.
                                </Text>
                            </Box>
                        </Flex>
                    </CardBody>
                </Card>

                {/* Nature of the Project */}
                <Box>
                    <Heading as="h3" size="lg" mb={4} color="white">
                        Nature of the Project
                    </Heading>
                    <Text color="surface.300" mb={4} fontSize="lg" lineHeight="tall">
                        This project is a personal initiative designed to assist developers in managing and synchronizing databases. It operates as a "solo person project" and is provided as a utility tool for the community.
                    </Text>
                    <Text color="surface.300" fontSize="lg" lineHeight="tall">
                        While we strive for high quality and reliability, this tool does not come with the enterprise-level guarantees, support, or service level agreements (SLAs) typically associated with commercial software products.
                    </Text>
                </Box>

                <Divider borderColor="surface.700" />

                {/* Limitation of Liability */}
                <Box>
                    <Heading as="h3" size="lg" mb={4} color="white">
                        Limitation of Liability
                    </Heading>
                    <Text color="surface.300" mb={4} fontSize="lg" lineHeight="tall">
                        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
                    </Text>
                    <Card bg="surface.800" borderColor="surface.700">
                        <CardBody>
                            <Text color="surface.300" fontSize="md" lineHeight="tall">
                                In no event shall the authors, copyright holders, or contributors be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.
                            </Text>
                        </CardBody>
                    </Card>
                </Box>

                <Divider borderColor="surface.700" />

                {/* User Responsibility */}
                <Box>
                    <Badge colorScheme="red" mb={2}>IMPORTANT</Badge>
                    <Heading as="h3" size="lg" mb={4} color="white">
                        User Responsibility
                    </Heading>
                    <Text color="surface.300" fontSize="lg" mb={4}>
                        Users are solely responsible for:
                    </Text>
                    <UnorderedList spacing={3} pl={4} color="surface.300" fontSize="lg">
                        <ListItem>The security and integrity of their database credentials and data.</ListItem>
                        <ListItem>Creating backups before performing any synchronization or migration operations.</ListItem>
                        <ListItem>Verifying the accuracy of generated migration scripts before execution.</ListItem>
                        <ListItem>Ensuring compliance with their own organization's data policies.</ListItem>
                    </UnorderedList>
                </Box>

                <Divider borderColor="surface.700" />

                {/* Privacy & Data */}
                <Box>
                    <Heading as="h3" size="lg" mb={4} color="white">
                        Privacy & Data Handling
                    </Heading>
                    <Text color="surface.300" fontSize="lg" lineHeight="tall">
                        Suparbase is designed with privacy in mind. When self-hosted, your database credentials and data remain within your own infrastructure. We do not track, collect, or store your database contents on external servers unless you explicitly configure the tool to do so (e.g., using a hosted version).
                    </Text>
                </Box>

                <Divider borderColor="surface.700" />

                {/* Contact */}
                <Box>
                    <Heading as="h3" size="lg" mb={4} color="white">
                        Contact & Support
                    </Heading>
                    <Text color="surface.300" fontSize="lg" mb={4}>
                        For questions regarding this legal notice or to report issues, please contact the developer via the official repository or support channels provided within the application.
                    </Text>
                    <Text color="surface.400" fontSize="sm">
                        Please note that as a community-driven project, support is provided on a best-effort basis.
                    </Text>
                </Box>

            </VStack>
        </Container>
    );
}
