import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
  InputGroup,
  InputLeftAddon,
  Flex,
  Text,
  Icon,
  Image,
  Link,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { QRCodeSVG } from 'qrcode.react';
import { api } from './utils/api';

const Attendence = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [genericError, setGenericError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setCandidates([]);
    setTotalCandidates(0);
    setNotFound(false);
    setGenericError('');
    const trimmedPhone = phone.trim().replace(/\D/g, '');

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/users/get-qr-codes', {
        whatsappNumber: trimmedPhone,
      });

      const data = await res.json();

      if (res.ok) {
        console.log('✅ QR codes response:', data);

        if (data.candidates && data.candidates.length > 0) {
          setCandidates(data.candidates);
          setTotalCandidates(data.totalCandidates || data.candidates.length);
          setPhone('');
        } else {
          setGenericError('No QR codes found for this number');
        }
      } else {
        const errMsg = data?.message?.toLowerCase() || '';
        if (
          errMsg.includes('not found') ||
          errMsg.includes('not registered') ||
          errMsg.includes('no user')
        ) {
          setNotFound(true);
        } else {
          setGenericError(data.message || 'Could not fetch QR codes');
        }
      }
    } catch (err) {
      setGenericError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const formatDate = isoString => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString();
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" px={2}>
      <Box
        w="full"
        maxW="400px"
        bg="white"
        p={8}
        borderRadius="2xl"
        boxShadow="xl"
        textAlign="center"
      >
        <Heading mb={2} size="lg" color="teal.600" fontWeight="bold">
          View QR Codes
        </Heading>
        <Text mb={7} fontSize="md" color="gray.500">
          Enter your WhatsApp mobile number to view all your QR codes for
          attendance.
        </Text>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <FormControl isInvalid={!!error}>
            <FormLabel htmlFor="phone" fontWeight="medium">
              WhatsApp Number
            </FormLabel>
            <InputGroup>
              <InputLeftAddon children="+91" />
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile"
                value={phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setPhone(val);
                }}
                maxLength={10}
                autoComplete="tel"
                bg="gray.100"
                fontWeight="medium"
                letterSpacing="wide"
                required
                isDisabled={loading}
              />
            </InputGroup>
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>

          <Button
            mt={6}
            colorScheme="teal"
            width="full"
            type="submit"
            isLoading={loading}
            loadingText="Loading..."
            disabled={loading || phone.length !== 10}
            fontWeight="bold"
            fontSize="lg"
            borderRadius="lg"
            boxShadow="md"
          >
            View QR Codes
          </Button>
        </form>

        {notFound && (
          <Box
            mt={6}
            p={4}
            borderRadius="lg"
            bg="orange.50"
            border="1px solid"
            borderColor="orange.200"
            textAlign="left"
          >
            <Flex align="center" mb={2}>
              <Icon as={WarningIcon} color="orange.400" mr={2} boxSize={6} />
              <Text fontWeight="bold" color="orange.600">
                Number not registered!
              </Text>
            </Flex>
            <Text color="orange.700" fontSize="md" mb={2}>
              Please register here:{' '}
              <Link
                color="teal.600"
                href="https://subharambham.harekrishnavizag.org/"
                isExternal
                fontWeight="bold"
                textDecoration="underline"
              >
                https://subharambham.harekrishnavizag.org/
              </Link>
            </Text>
            <Text color="orange.700" fontSize="md">
              And please visit the enquiry counter.
            </Text>
          </Box>
        )}

        {genericError && (
          <Box
            mt={6}
            p={4}
            borderRadius="lg"
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            textAlign="left"
          >
            <Flex align="center" mb={2}>
              <Icon as={WarningIcon} color="red.400" mr={2} boxSize={6} />
              <Text fontWeight="bold" color="red.600">
                Error
              </Text>
            </Flex>
            <Text color="red.700" fontSize="md">
              {genericError}
            </Text>
          </Box>
        )}

        {candidates.length > 0 && (
          <Box mt={8} textAlign="center">
            <Icon as={CheckCircleIcon} w={12} h={12} color="blue.400" />
            <Text mt={3} fontSize="xl" fontWeight="bold" color="blue.600">
              Found {totalCandidates} registration
              {totalCandidates > 1 ? 's' : ''} for this number
            </Text>

            <Text fontSize="lg" color="teal.700" mb={4} mt={4}>
              QR Code{totalCandidates > 1 ? 's' : ''} for Attendance
            </Text>

            <SimpleGrid
              columns={{ base: 1, md: totalCandidates > 2 ? 2 : 1 }}
              spacing={6}
              mt={6}
            >
              {candidates.map((candidate, index) => (
                <Box
                  key={candidate.id || index}
                  p={4}
                  bg={candidate.isAttended ? 'green.50' : 'gray.50'}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={
                    candidate.isAttended ? 'green.300' : 'orange.300'
                  }
                  textAlign="center"
                >
                  <VStack spacing={3}>
                    <HStack justify="center" align="center" wrap="wrap">
                      <Text fontSize="lg" fontWeight="bold" color="teal.700">
                        {candidate.name}
                      </Text>
                      {candidate.isAttended ? (
                        <Badge colorScheme="green" fontSize="xs">
                          ✅ Attended
                        </Badge>
                      ) : (
                        <Badge colorScheme="orange" fontSize="xs">
                          ⏳ Not Attended
                        </Badge>
                      )}
                    </HStack>

                    {candidate.college && (
                      <Text fontSize="sm" color="gray.600">
                        {candidate.college}
                      </Text>
                    )}

                    {candidate.course && candidate.year && (
                      <Text fontSize="sm" color="gray.600">
                        {candidate.course} - {candidate.year}
                        {candidate.year === '1'
                          ? 'st'
                          : candidate.year === '2'
                          ? 'nd'
                          : candidate.year === '3'
                          ? 'rd'
                          : 'th'}{' '}
                        Year
                      </Text>
                    )}

                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      bg="white"
                      p={3}
                      borderRadius="lg"
                    >
                      <QRCodeSVG value={candidate.attendanceToken} size={160} />
                    </Box>

                    {(candidate.attendanceDate ||
                      candidate.adminAttendanceDate) && (
                      <Text fontSize="xs" color="gray.500">
                        Attended:{' '}
                        {formatDate(
                          candidate.adminAttendanceDate ||
                            candidate.attendanceDate
                        )}
                      </Text>
                    )}

                    {!candidate.isAttended && (
                      <Text fontSize="xs" color="orange.600" fontWeight="bold">
                        📱 Show this QR to admin for attendance
                      </Text>
                    )}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>

            <Box mt={6}>
              <Image
                mx="auto"
                src="/Success.gif"
                alt="Success"
                boxSize="180px"
                borderRadius="full"
                objectFit="cover"
              />
              <Text mt={2} fontSize="md" fontWeight="bold" color="teal.600">
                Show{' '}
                {totalCandidates > 1 ? 'individual QR codes' : 'this QR code'}{' '}
                to admin for attendance.
              </Text>
              {totalCandidates > 1 && (
                <Text mt={1} fontSize="sm" color="gray.600">
                  Each person must scan their own QR code individually.
                </Text>
              )}

              {/* Show count of attended vs not attended */}
              {(() => {
                const attendedCount = candidates.filter(
                  c => c.isAttended
                ).length;
                const notAttendedCount = totalCandidates - attendedCount;
                return (
                  <HStack justify="center" mt={3} spacing={4}>
                    {attendedCount > 0 && (
                      <Badge colorScheme="green" fontSize="sm">
                        ✅ {attendedCount} Attended
                      </Badge>
                    )}
                    {notAttendedCount > 0 && (
                      <Badge colorScheme="orange" fontSize="sm">
                        ⏳ {notAttendedCount} Pending
                      </Badge>
                    )}
                  </HStack>
                );
              })()}
            </Box>
          </Box>
        )}
      </Box>
    </Flex>
  );
};

export default Attendence;
