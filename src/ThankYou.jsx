import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Icon,
  Image,
  Link,
  Stack,
  Text,
  VStack,
  Spinner,
  HStack,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import SubharambhamLogo from './component/newLogo.png';
import natureBg from './component/Subharambham-nature.jpg';
const API_BASE =
  'https://hkm-subharambham-backend-882278565284.asia-south1.run.app';
// const API_BASE = 'http://localhost:3300';
// Gender-specific WhatsApp group links and QR images (served from public/)
const WHATSAPP_GROUP_URLS = {
  male: 'https://chat.whatsapp.com/Gwm3Z9HIM7D1ORJsXOQjCN',
  female: 'https://chat.whatsapp.com/IyGpuzrHPCS6YIyE4W06wA',
};
const QR_IMAGE_PATHS = {
  male: '/Subharambham_B_QR_Code.png',
  female: '/Subharambham_G_QR_Code.png',
};

export default function ThankYouPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1' || id === 'preview';

  const [status, setStatus] = useState(isPreview ? 'success' : 'loading');
  const [candidate, setCandidate] = useState(
    isPreview
      ? {
          name: 'Demo User',
          paymentAmount: 99,
          paymentId: 'DEMO_PAYMENT_ID',
          orderId: 'DEMO_ORDER_ID',
          gender: 'Female', // For preview only; real page uses backend gender
        }
      : null
  );

  const checkPaymentStatus = async (showLoading = true) => {
    if (showLoading) setStatus('loading');

    try {
      console.log(`🔍 Checking payment status for ID: ${id}...`);
      const res = await axios.get(`${API_BASE}/users/verify-payment/${id}`);
      console.log('📋 Full API Response:', res.data);
      console.log(
        '✅ Payment Status from API:',
        res.data.candidate?.paymentStatus
      );

      if (res.status === 200) {
        if (res.data.success && res.data.candidate) {
          console.log(
            '✅ Payment verification successful:',
            res.data.candidate
          );
          setCandidate(res.data.candidate);

          // Check payment status more reliably
          const paymentStatus = res.data.candidate.paymentStatus;
          console.log(`💳 Processing payment status: ${paymentStatus}`);

          if (paymentStatus === 'Paid') {
            console.log('🎉 Payment confirmed as PAID');
            setStatus('success');
            return 'success';
          } else if (paymentStatus === 'Failed') {
            console.log('❌ Payment confirmed as FAILED');
            setStatus('failed');
            return 'failed';
          } else {
            console.log('⏳ Payment still PENDING');
            setStatus('pending');
            return 'pending';
          }
        } else {
          console.log('❌ API response missing success or candidate data');
          setStatus('invalid');
          return 'invalid';
        }
      } else {
        console.log('❌ API returned non-200 status:', res.status);
        setStatus('error');
        return 'error';
      }
    } catch (err) {
      console.error('❌ Payment verification error:', err);
      console.error('❌ Error details:', err.response?.data);
      setStatus('error');
      return 'error';
    }
  };

  // Immediate payment verification for urgent cases
  const triggerImmediateVerification = async (orderId, paymentId) => {
    try {
      console.log(
        `🚀 Triggering immediate payment verification for orderId: ${orderId}, paymentId: ${paymentId}`
      );
      const response = await axios.post(
        `${API_BASE}/users/verify-payment-immediately`,
        {
          orderId: orderId,
          paymentId: paymentId,
        }
      );

      console.log('🔍 Immediate verification response:', response.data);

      if (response.data.success) {
        console.log('✅ Immediate verification successful! Payment updated.');
        // Refresh the candidate data
        await checkPaymentStatus(false);
        return true;
      } else {
        console.log('⚠️ Immediate verification did not find payment yet');
        return false;
      }
    } catch (error) {
      console.error('❌ Immediate verification failed:', error);
      return false;
    }
  };

  useEffect(() => {
    if (isPreview) {
      return; // Skip polling in preview mode
    }
    let attempts = 0;
    const maxAttempts = 12; // Increased from 10 to 12
    let pollInterval;

    const verifyPaymentWithPolling = async () => {
      const result = await checkPaymentStatus(attempts === 0);

      if (result === 'success' || result === 'failed') {
        if (pollInterval) clearInterval(pollInterval);
        return;
      }

      // On 3rd attempt (after 6 seconds), try immediate verification
      if (result === 'pending' && attempts === 2 && candidate?.orderId) {
        console.log(
          '🚀 Payment still pending after 6s, trying immediate verification...'
        );
        const immediateResult = await triggerImmediateVerification(
          candidate.orderId,
          candidate.paymentId
        );
        if (immediateResult) {
          console.log('✅ Immediate verification found the payment!');
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
      }

      // On 6th attempt (after 15 seconds), try immediate verification again
      if (result === 'pending' && attempts === 5 && candidate?.orderId) {
        console.log(
          '🚀 Payment still pending after 15s, trying immediate verification again...'
        );
        const immediateResult = await triggerImmediateVerification(
          candidate.orderId,
          candidate.paymentId
        );
        if (immediateResult) {
          console.log('✅ Second immediate verification found the payment!');
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
      }

      attempts++;
      if (attempts >= maxAttempts) {
        if (pollInterval) clearInterval(pollInterval);
        console.log('⏰ Maximum verification attempts reached');
        return;
      }
    };

    if (id) {
      verifyPaymentWithPolling();
      pollInterval = setInterval(verifyPaymentWithPolling, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <Center
        minH="100vh"
        bgImage={`linear-gradient(to right, rgba(11,61,145,0.82), rgba(106,13,173,0.82)), url(${natureBg})`}
        // bgAttachment=""
        bgSize="cover"
        bgPosition="10% 40%"
        // style={{
        //   backgroundColor: '#e9f8ef',
        //   backgroundBlendMode: 'overlay',
        // }}
      >
        <Spinner size="xl" color="teal.500" />
      </Center>
    );
  }

  if (status === 'pending') {
    return (
      <Box
        minH="100vh"
        bgImage={`linear-gradient(to right, rgba(11,61,145,0.82), rgba(106,13,173,0.82)), url(${natureBg})`}
        // bgAttachment=""
        bgSize="cover"
        bgPosition="10% 40%"
        // style={{
        //   backgroundColor: '#e9f8ef',
        //   backgroundBlendMode: 'overlay',
        // }}
        py={8}
        px={4}
      >
        <Box textAlign="center" mt={20} p={6}>
          <VStack spacing={4}>
            <Spinner size="xl" color="orange.500" />
            <Heading size="lg" color="orange.500">
              Payment Processing
            </Heading>
            <Text>
              Your payment is being processed. This usually takes 10-20 seconds.
            </Text>
            <Text fontSize="sm" color="gray.600">
              Payment ID: {id}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Please wait... We're automatically checking your payment status.
            </Text>
            <VStack spacing={3}>
              <Button
                colorScheme="teal"
                variant="ghost"
                onClick={() => navigate('/')}
              >
                Register Another Person
              </Button>
            </VStack>
            <Text fontSize="xs" color="gray.400">
              Need help? Contact support with your payment ID above.
            </Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (status === 'failed') {
    return (
      <Box
        minH="100vh"
        bgImage={`linear-gradient(to right, rgba(11,61,145,0.82), rgba(106,13,173,0.82)), url(${natureBg})`}
        // bgAttachment=""
        bgSize="cover"
        bgPosition="10% 40%"
        // style={{
        //   backgroundColor: '#e9f8ef',
        //   backgroundBlendMode: 'overlay',
        // }}
        py={8}
        px={4}
      >
        <Box textAlign="center" mt={20} p={6}>
          <VStack spacing={4}>
            <Text fontSize="6xl">❌</Text>
            <Heading size="lg" color="red.500">
              Payment Failed
            </Heading>
            <Text>
              Your payment was not successful. This could be due to payment
              cancellation, insufficient funds, or a technical issue.
            </Text>
            {candidate?.paymentFailureReason && (
              <Text
                fontSize="sm"
                color="gray.600"
                p={3}
                bg="gray.100"
                borderRadius="md"
              >
                Reason: {candidate.paymentFailureReason}
              </Text>
            )}
            <Text fontSize="sm" color="gray.600">
              Payment ID: {id}
            </Text>
            <VStack spacing={3}>
              <Button colorScheme="teal" onClick={() => navigate('/')}>
                Try Registration Again
              </Button>
              <Button
                colorScheme="gray"
                variant="outline"
                onClick={() =>
                  (window.location.href = 'mailto:krishnapulse@gmail.com')
                }
              >
                Contact Support
              </Button>
            </VStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (status === 'invalid' || status === 'error') {
    return (
      <Box
        minH="100vh"
        bgImage={`linear-gradient(to right, rgba(11,61,145,0.82), rgba(106,13,173,0.82)), url(${natureBg})`}
        // bgAttachment=""
        bgSize="cover"
        bgPosition="10% 40%"
        // style={{
        //   backgroundColor: '#e9f8ef',
        //   backgroundBlendMode: 'overlay',
        // }}
        py={8}
        px={4}
      >
        <Box textAlign="center" mt={20} p={6}>
          <VStack spacing={4}>
            <Heading
              size="lg"
              color={status === 'invalid' ? 'red.500' : 'orange.500'}
            >
              {status === 'invalid' ? 'Invalid Payment' : 'Server Error'}
            </Heading>
            <Text>
              {status === 'invalid'
                ? "This payment ID is not valid or doesn't match any registration."
                : 'Something went wrong while verifying your payment. Please try again later.'}
            </Text>
            <Button colorScheme="teal" onClick={() => navigate('/')}>
              Go Back to Home
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bgImage={`linear-gradient(to right, rgba(11,61,145,0.82), rgba(106,13,173,0.82)), url(${natureBg})`}
      // bgAttachment=""
      bgSize="cover"
      bgPosition="10% 40%"
      py={{ base: 2, md: 8 }}
      px={4}
      // style={{
      //   backgroundColor: '#e9f8ef',
      //   backgroundBlendMode: 'overlay',
      // }}
    >
      {(() => {
        // Prime derived gender from backend, navigation state, or local storage
        const storedMeta = (() => {
          try {
            if (!id) return null;
            const raw = localStorage.getItem(`regMeta:${id}`);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })();
        const navGender = location.state?.gender;
        const resolvedGender = (
          candidate?.gender ||
          navGender ||
          storedMeta?.gender ||
          ''
        ).trim();
        const genderNormalized = resolvedGender.toLowerCase();
        const isKnownGender =
          genderNormalized === 'male' || genderNormalized === 'female';
        const groupUrl = isKnownGender
          ? WHATSAPP_GROUP_URLS[genderNormalized]
          : null;
        const qrImgSrc = isKnownGender
          ? QR_IMAGE_PATHS[genderNormalized]
          : null;
        const groupLabel =
          genderNormalized === 'male'
            ? 'Boys'
            : genderNormalized === 'female'
            ? 'Girls'
            : '';
        // Expose for use below via closure (no visual render here)
        return <Box display="none" />;
      })()}
      <Box maxW="2xl" mx="auto">
        <Flex
          align="center"
          justify="center"
          gap={4}
          mb={8}
          direction="row"
          textAlign="left"
          flexWrap="wrap"
        >
          <Box
            position="relative"
            boxSize={{ base: '72px', sm: '84px', md: '96px' }}
            borderRadius="full"
            overflow="hidden"
            border="3px solid #20603d"
            flexShrink={0}
            aspectRatio="1 / 1"
            bg="white"
          >
            <Image
              src={SubharambhamLogo}
              alt="Subharambham Youth Festival Logo"
              width="100%"
              height="100%"
              objectFit="contain"
              objectPosition="center"
              borderRadius="full"
              display="block"
              shadow="lg"
            />
            <Center
              position="absolute"
              top="-2"
              right="-2"
              bg="green.500"
              rounded="full"
              p={1}
            >
              <Icon as={CheckCircle} w={6} h={6} color="white" />
            </Center>
          </Box>
          <Box ml={2}>
            <Heading
              size="lg"
              color="#ffffffff"
              fontWeight="bold"
              lineHeight="short"
            >
              Subharambham
            </Heading>
            <Text fontSize="md" fontWeight="semibold" mt={2} color="#ffffffff">
              Hare Krishna's New Year Explosion
            </Text>
          </Box>
        </Flex>

        <Box
          bgGradient="linear(to-r, #20603d, #43a047)"
          color="white"
          p={6}
          rounded="lg"
          shadow="xl"
          textAlign="center"
          mb={6}
        >
          <Heading fontSize="2xl" mb={2}>
            🎉 Registration Successful!
          </Heading>
          <Text fontSize="lg" opacity={0.9}>
            Welcome to Subharambham Hare Krishna's New Year Explosion 2026
          </Text>
        </Box>

        {candidate && (
          <Box bg="white" p={4} rounded="lg" shadow="md" mb={6}>
            <Text fontWeight="bold" color="#20603d" mb={1}>
              Thank you, {candidate.name}!
            </Text>
            <Text fontSize="sm" color="gray.600">
              We've received your payment of ₹{candidate.paymentAmount || 'N/A'}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Payment ID: {candidate.paymentId || id}
            </Text>
          </Box>
        )}

        <Box bg="white" p={6} rounded="lg" shadow="lg" mb={6}>
          <Stack spacing={6}>
            <Box textAlign="center">
              <Heading size="md" color="#20603d" mb={2}>
                Your Registration is Confirmed!
              </Heading>
            </Box>

            <VStack spacing={4} align="stretch">
              <Flex align="center" gap={3} p={3} bg="green.50" rounded="lg">
                <Icon as={Calendar} w={5} h={5} color="#20603d" />
                <Box>
                  <Text fontWeight="semibold">Event Date</Text>
                  <Text fontSize="sm" color="gray.600">
                    Thursday - 1st January 2026
                  </Text>
                </Box>
              </Flex>

              <Flex align="center" gap={3} p={3} bg="green.50" rounded="lg">
                <Icon as={MapPin} w={5} h={5} color="#20603d" />
                <Box>
                  <Text fontWeight="semibold">Venue</Text>
                  <Text fontSize="sm" color="gray.600">
                    Hare Krishna Vaikuntham Temple, Gambhiram
                  </Text>
                </Box>
              </Flex>

              {(() => {
                // Resolve gender: backend -> navigation state -> localStorage
                const storedMeta = (() => {
                  try {
                    if (!id) return null;
                    const raw = localStorage.getItem(`regMeta:${id}`);
                    return raw ? JSON.parse(raw) : null;
                  } catch {
                    return null;
                  }
                })();
                const navGender = location.state?.gender;
                const resolvedGender = (
                  candidate?.gender ||
                  navGender ||
                  storedMeta?.gender ||
                  ''
                )
                  .trim()
                  .toLowerCase();
                const isKnownGender =
                  resolvedGender === 'male' || resolvedGender === 'female';
                const groupUrl = isKnownGender
                  ? WHATSAPP_GROUP_URLS[resolvedGender]
                  : null;
                const qrImgSrc = isKnownGender
                  ? QR_IMAGE_PATHS[resolvedGender]
                  : null;
                const groupLabel =
                  resolvedGender === 'male'
                    ? 'Boys'
                    : resolvedGender === 'female'
                    ? 'Girls'
                    : '';

                if (!isKnownGender) {
                  return (
                    <Box
                      bg="yellow.50"
                      color="black"
                      rounded="xl"
                      p={{ base: 4, md: 5 }}
                      shadow="md"
                    >
                      <Stack spacing={2} textAlign="center">
                        <Heading size="sm" color="#20603d">
                          WhatsApp Group Access
                        </Heading>
                        <Text fontSize="sm" color="gray.700">
                          We will share the appropriate WhatsApp group link to
                          your registered WhatsApp number once your gender is
                          confirmed by our backend.
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          If this persists, please contact support with your
                          payment ID.
                        </Text>
                      </Stack>
                    </Box>
                  );
                }

                return (
                  <Box
                    bgGradient="linear(to-r, #128C7E, #25D366)"
                    color="white"
                    rounded="xl"
                    p={{ base: 4, md: 5 }}
                    shadow="xl"
                  >
                    <Stack
                      direction={{ base: 'column', md: 'row' }}
                      align="center"
                      justify="space-between"
                      spacing={{ base: 4, md: 6 }}
                    >
                      <VStack align="start" spacing={1} flex={1}>
                        <Text
                          fontWeight="bold"
                          fontSize={{ base: 'md', md: 'lg' }}
                        >
                          Join our WhatsApp Group
                        </Text>
                        <Text
                          fontSize={{ base: 'sm', md: 'sm' }}
                          opacity={0.95}
                        >
                          Tap join or scan the QR to get flash updates,
                          reminders, photos, and important announcements.
                        </Text>
                      </VStack>

                      <Stack
                        direction={{ base: 'column', md: 'row' }}
                        align="center"
                        spacing={{ base: 3, md: 4 }}
                      >
                        <Button
                          as="a"
                          href={groupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size={{ base: 'md', md: 'lg' }}
                          bg="#25D366"
                          color="white"
                          _hover={{
                            bg: '#1EBE57',
                            transform: 'translateY(-1px)',
                            boxShadow: 'lg',
                          }}
                          _active={{ bg: '#1AAE50' }}
                          leftIcon={
                            <Icon
                              viewBox="0 0 24 24"
                              w={{ base: 5, md: 6 }}
                              h={{ base: 5, md: 6 }}
                            >
                              <path
                                fill="currentColor"
                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.149-.672.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.173.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.672-1.613-.922-2.207-.242-.579-.487-.5-.672-.51-.173-.009-.372-.011-.571-.011-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.514-5.26c.001-5.45 4.436-9.883 9.888-9.883 2.64 0 5.112 1.03 6.963 2.9a9.825 9.825 0 0 1 2.914 6.957c-.003 5.45-4.436 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.86 11.86 0 0 0 5.717 1.459h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 0 0-3.464-8.413"
                              />
                            </Icon>
                          }
                          px={{ base: 5, md: 6 }}
                          fontWeight="bold"
                        >
                          Join WhatsApp Group
                        </Button>

                        <Box
                          display={{ base: 'none', sm: 'block' }}
                          bg="white"
                          p={2}
                          rounded="md"
                        >
                          <Image
                            src={qrImgSrc}
                            alt={`${groupLabel} WhatsApp QR`}
                            boxSize={{ base: '72px', md: '84px' }}
                            objectFit="contain"
                          />
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })()}

              <Flex align="center" gap={3} p={3} bg="green.50" rounded="lg">
                <Box>
                  <Text fontWeight="semibold" color="#20603d">
                    Highlights
                  </Text>
                  <SimpleGrid
                    columns={{ base: 1, sm: 2, md: 4 }}
                    spacing={3}
                    mt={2}
                  >
                    <Box textAlign="center" fontSize="sm">
                      <Text fontWeight="semibold">Spiritual Talk</Text>
                    </Box>
                    <Box textAlign="center" fontSize="sm">
                      <Text fontWeight="semibold">Games</Text>
                    </Box>
                    <Box textAlign="center" fontSize="sm">
                      <Text fontWeight="semibold">Ecstatic Dances</Text>
                    </Box>
                    <Box textAlign="center" fontSize="sm">
                      <Text fontWeight="semibold">Delicious Prasadam</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              </Flex>
            </VStack>

            <Box textAlign="center" p={4} bg="gray.100" rounded="lg">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Need Help?
              </Text>
              <HStack justify="center" spacing={4} fontSize="sm">
                <Link
                  href="mailto:krishnapulse@gmail.com"
                  color="#20603d"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon as={Mail} w={4} h={4} />
                  Email Support
                </Link>
                <Link
                  href="tel:+919876543210"
                  color="#20603d"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon as={Phone} w={4} h={4} />
                  Call Us
                </Link>
              </HStack>
            </Box>
          </Stack>
        </Box>

        <Center>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            leftIcon={<ArrowLeft />}
            color="#000000ff"
            bg="white"
          >
            Register Another Participant
          </Button>
        </Center>

        <Box
          textAlign="center"
          mt={8}
          p={4}
          bgGradient="linear(to-r, #20603d, #43a047)"
          color="white"
          rounded="lg"
        >
          <Text fontWeight="semibold" mb={1}>
            🙏 Hare Krishna! 🙏
          </Text>
          <Text fontSize="sm" opacity={0.9}>
            We're excited for a day with nature & divine!
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
