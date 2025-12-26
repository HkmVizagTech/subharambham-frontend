import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Select as ChakraSelect,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  VStack,
  Text,
  useToast,
  Spinner,
  Input,
  Badge,
  Flex,
  FormControl,
  FormLabel,
  Tag,
} from '@chakra-ui/react';
import Layout from './component/Layout';
import { api } from './utils/api';

const pickupPoints = [
  'Gajuwaka',
  'Sheela Nagar',
  'NAD',
  'Birla Junction',
  'Urvasi Jn',
  'Akkayyapalem',
  'Gurudwara',
  'Satyam Junction',
  'Maddilapalem',
  'Isukathota',
  'Venkojipalem',
  'Hanumanathawaka',
  'Yendada',
  'Car shed Jn',
  'Madhurawada',
  'Kommadi',
  'Tagarapuvalasa',
  'Sontyam',
];

const headers = [
  'S.No',
  'Name',
  'Gender',
  'Pickup/Drop',
  'College/Company',
  'WhatsAppNumber',
  'Payment',
  'Pickup Status',
  'Drop Status',
];

const statusColors = {
  Paid: 'green',
  Pending: 'yellow',
  Failed: 'red',
  Refunded: 'orange',
};

const escapeCsv = v => {
  if (v === undefined || v === null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const PickupList = () => {
  const toast = useToast();
  const [mode, setMode] = useState('both');
  const [location, setLocation] = useState(pickupPoints[0]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const path = `/users/admin/pickup-list?pickupDropLocation=${encodeURIComponent(
        location
      )}&mode=${encodeURIComponent(
        mode
      )}&page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`;
      console.debug('loadCandidates ->', { path });
      const res = await api.get(path);
      console.debug('loadCandidates response status', res.status);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Request failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      console.debug('loadCandidates response body', data);

      // Support multiple response shapes: { candidates: [] }, { records: [] }, paginated { docs: [] }, or raw array
      let list = [];
      if (Array.isArray(data.candidates)) list = data.candidates;
      else if (Array.isArray(data.records)) list = data.records;
      else if (Array.isArray(data)) list = data;
      else if (data.candidates && Array.isArray(data.candidates.docs))
        list = data.candidates.docs;
      else if (data.docs && Array.isArray(data.docs)) list = data.docs;

      setCandidates(list);
      console.log('Candidates list:', list);

      // extract total from possible fields
      const totalCount =
        typeof data.total === 'number'
          ? data.total
          : typeof data.totalDocs === 'number'
          ? data.totalDocs
          : typeof data.totalCount === 'number'
          ? data.totalCount
          : list.length;
      setTotal(totalCount);
    } catch (err) {
      console.error('loadCandidates error:', err);
      toast({ title: 'Failed to load candidates', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // load whenever page, limit, location change
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, location]);

  const exportCsv = () => {
    const rows = [headers.join(',')];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const phoneForCsv = c.whatsappNumber ? `="${c.whatsappNumber}"` : '';
      const row = [
        escapeCsv(i + 1),
        escapeCsv(c.name),
        escapeCsv(c.gender),
        escapeCsv(c.pickupDropLocation),
        escapeCsv(c.college || c.companyName),
        escapeCsv(phoneForCsv),
        escapeCsv(c.paymentStatus),
        escapeCsv(c.pickupStatus || (c.transportRequired ? 'Yes' : 'No')),
        escapeCsv(c.dropStatus || (c.transportRequired ? 'Yes' : 'No')),
      ];
      rows.push(row.join(','));
    }
    const blob = new Blob([rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pickup_list_${mode}_${location || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <Box
        px={{ base: 2, md: 8 }}
        py={6}
        maxW="100vw"
        minH="100vh"
        bg="gray.50"
      >
        <Flex justify="space-between" align="center" mb={6} wrap="wrap">
          <Heading size="lg" color="teal.700">
            Pickup / Drop List (Admin)
          </Heading>
        </Flex>

        <Box
          mb={4}
          overflowX="auto"
          py={2}
          px={2}
          bg="white"
          borderRadius="md"
          boxShadow="sm"
        >
          <Flex gap={4} align="flex-end" wrap="nowrap" minW="600px">
            <FormControl w="140px">
              <FormLabel fontSize="sm">Mode</FormLabel>
              <ChakraSelect
                value={mode}
                onChange={e => setMode(e.target.value)}
                size="sm"
                bg="gray.50"
                isDisabled
              >
                <option value="pickup">Pickup</option>
                <option value="drop">Drop</option>
                <option value="both">Both</option>
              </ChakraSelect>
            </FormControl>

            <FormControl w="220px">
              <FormLabel fontSize="sm">Location</FormLabel>
              <ChakraSelect
                value={location}
                onChange={e => setLocation(e.target.value)}
                size="sm"
                bg="gray.50"
              >
                {pickupPoints.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </ChakraSelect>
            </FormControl>

            <FormControl w="320px">
              <FormLabel fontSize="sm">Search</FormLabel>
              <Input
                placeholder="Name, phone, email, college"
                value={q}
                onChange={e => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                bg="gray.50"
                size="sm"
              />
            </FormControl>

            <ChakraSelect
              value={limit}
              onChange={e => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              w="120px"
              size="sm"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </ChakraSelect>

            <Button
              onClick={() => {
                setPage(1);
                loadCandidates();
              }}
              colorScheme="teal"
            >
              Load
            </Button>
            <Button
              onClick={exportCsv}
              colorScheme="green"
              isDisabled={candidates.length === 0}
            >
              Export CSV
            </Button>
          </Flex>
        </Box>

        <HStack mb={4} spacing={4}>
          <Badge colorScheme="purple">Total: {total}</Badge>
          <Badge colorScheme="green">Showing: {candidates.length}</Badge>
        </HStack>

        {loading ? (
          <Box textAlign="center" py={16}>
            <Spinner />
          </Box>
        ) : (
          <Box overflowX="auto" rounded="md" boxShadow="md" bg="white" p={2}>
            <Table variant="simple" size="sm">
              <Thead bg="gray.100">
                <Tr>
                  <Th>#</Th>
                  <Th>Name</Th>
                  <Th>Gender</Th>
                  <Th>Pickup/Drop</Th>
                  <Th>College/Company</Th>
                  <Th>WhatsApp</Th>
                  <Th>Payment</Th>
                  <Th>Pickup Status</Th>
                  <Th>Drop Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {candidates.map((c, idx) => (
                  <Tr
                    key={c._id}
                    _hover={{ bg: 'blue.50', cursor: 'pointer' }}
                    transition="all 0.15s"
                  >
                    <Td>{(page - 1) * limit + idx + 1}</Td>
                    <Td>{c.name}</Td>
                    <Td>{c.gender}</Td>
                    <Td>{c.pickupDropLocation}</Td>
                    <Td>{c.college || c.companyName}</Td>
                    <Td>{c.whatsappNumber}</Td>
                    <Td>
                      <Tag
                        size="sm"
                        colorScheme={statusColors[c.paymentStatus] || 'gray'}
                      >
                        {c.paymentStatus || '-'}
                      </Tag>
                    </Td>
                    <Td>
                      {c.pickupStatus || (c.transportRequired ? 'Yes' : 'No')}
                    </Td>
                    <Td>
                      {c.dropStatus || (c.transportRequired ? 'Yes' : 'No')}
                    </Td>
                  </Tr>
                ))}
                {candidates.length === 0 && (
                  <Tr>
                    <Td colSpan={9}>
                      <Text color="gray.400" textAlign="center" py={6}>
                        No candidates found.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        )}

        <HStack mt={4} justify="space-between">
          <Text>
            Showing{' '}
            {candidates.length === 0
              ? 0
              : Math.min(total, (page - 1) * limit + 1)}{' '}
            - {Math.min(total, page * limit)} of {total}
          </Text>
          <HStack>
            <Button
              onClick={() => {
                if (page > 1) {
                  setPage(p => p - 1);
                }
              }}
              isDisabled={page <= 1}
            >
              Prev
            </Button>
            <Text>Page {page}</Text>
            <Button
              onClick={() => {
                if (page * limit < total) {
                  setPage(p => p + 1);
                }
              }}
              isDisabled={page * limit >= total}
            >
              Next
            </Button>
          </HStack>
        </HStack>
      </Box>
    </Layout>
  );
};

export default PickupList;
