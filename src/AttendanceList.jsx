import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  Input,
  Flex,
  FormControl,
  FormLabel,
  Tooltip,
  Text,
  HStack,
  Badge,
  Select,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  WarningIcon,
  DownloadIcon,
  PhoneIcon,
} from '@chakra-ui/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import Layout from './component/Layout';
import { api } from './utils/api';

const AttendanceList = () => {
  const [data, setData] = useState([]);
  const [filteredCollege, setFilteredCollege] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // token handled by api helper

      try {
        // Use getAllCandidates endpoint to get ALL registrations (attended + not attended)
        const response = await api.get('/users/');

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          navigate('/admin/login');
          return;
        }

        const data = await response.json();
        console.log('All Candidates API Response:', data);
        const records = Array.isArray(data)
          ? data
          : data.candidates || data.records || [];

        if (Array.isArray(records)) {
          // Sort by phone number to group family members together
          const sortedRecords = records.sort((a, b) => {
            if (a.whatsappNumber === b.whatsappNumber) {
              return a.name.localeCompare(b.name);
            }
            return a.whatsappNumber.localeCompare(b.whatsappNumber);
          });
          setData(sortedRecords);
        } else {
          console.error('All Candidates API response is not an array:', data);
          setData([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch candidates list', err);
        setData([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filterByDate = candidate => {
    if (!startDate && !endDate) return true;
    const candidateDate = candidate.attendanceDate
      ? new Date(candidate.attendanceDate)
      : candidate.registrationDate
      ? new Date(candidate.registrationDate)
      : null;
    if (!candidateDate) return false;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : null;
    if (start && candidateDate < start) return false;
    if (end && candidateDate > end) return false;
    return true;
  };

  const filteredData = (Array.isArray(data) ? data : []).filter(c => {
    const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
    const dateMatch = filterByDate(c);
    const searchMatch =
      search.length < 2 ||
      [c.name, c.email, c.whatsappNumber, c.college, c.branch]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
    return collegeMatch && dateMatch && searchMatch;
  });

  const uniqueColleges = [
    ...new Set(
      (Array.isArray(data) ? data : []).map(c => c.college).filter(Boolean)
    ),
  ];

  const exportToExcel = () => {
    const dataToExport = Array.isArray(filteredData) ? filteredData : [];
    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map((row, idx) => ({
        'S.No': idx + 1,
        Name: row.name,
        Gender: row.gender,
        Email: row.email,
        'College/Company': row.college,
        Branch: row.branch,
        Phone: row.whatsappNumber,
        Attendance: row.adminAttendance || row.attendance ? 'Yes' : 'No',
        'Attendance Date':
          row.adminAttendanceDate || row.attendanceDate
            ? new Date(
                row.adminAttendanceDate || row.attendanceDate
              ).toLocaleString()
            : '',
        'Registration Date': row.registrationDate
          ? new Date(row.registrationDate).toLocaleString()
          : '',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Registrations');
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const file = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });
    saveAs(file, 'all-registrations-attendance.xlsx');
  };

  if (loading)
    return (
      <Layout>
        <Flex justify="center" align="center" minH="70vh">
          <Spinner size="xl" />
        </Flex>
      </Layout>
    );

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
            All Registrations & Attendance
          </Heading>
          <Button
            colorScheme="teal"
            variant="solid"
            leftIcon={<DownloadIcon />}
            onClick={exportToExcel}
            minW="140px"
            size="sm"
          >
            Export to Excel
          </Button>
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
            <FormControl w="200px">
              <FormLabel fontSize="sm">College/Company</FormLabel>
              <Select
                placeholder="Select College/Company"
                onChange={e => setFilteredCollege(e.target.value)}
                value={filteredCollege}
                bg="gray.50"
                size="sm"
              >
                {uniqueColleges.map((college, i) => (
                  <option key={i} value={college}>
                    {college}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl w="150px">
              <FormLabel fontSize="sm">From</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
            <FormControl w="150px">
              <FormLabel fontSize="sm">To</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
            <FormControl w="220px">
              <FormLabel fontSize="sm">
                Search (Name, Phone, Email, College)
              </FormLabel>
              <Input
                placeholder="Enter phone number to see all family members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
          </Flex>
        </Box>

        <HStack mb={4} spacing={4} wrap="wrap">
          <Badge colorScheme="blue" fontSize="lg">
            Total Registrations: {filteredData?.length || 0}
          </Badge>
          <Badge colorScheme="green" fontSize="lg">
            Attended:{' '}
            {filteredData?.filter(c => c.adminAttendance || c.attendance)
              ?.length || 0}
          </Badge>
          <Badge colorScheme="orange" fontSize="lg">
            Not Attended:{' '}
            {filteredData?.filter(c => !c.adminAttendance && !c.attendance)
              ?.length || 0}
          </Badge>
        </HStack>

        <Box overflowX="auto" rounded="md" boxShadow="md" bg="white" p={2}>
          <Table variant="simple" size="sm">
            <Thead bg="gray.100">
              <Tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th>Gender</Th>
                <Th>Phone</Th>
                <Th minW="180px">College/Company</Th>
                <Th>Branch</Th>
                <Th>Email</Th>
                <Th>Attendance</Th>
                <Th>Attendance Date</Th>
                <Th>Registration Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredData.map((candidate, idx) => {
                // Check if this phone number has multiple registrations (family members)
                const familyMembers = filteredData.filter(
                  c => c.whatsappNumber === candidate.whatsappNumber
                );
                const isFamily = familyMembers.length > 1;
                const familyAttended = familyMembers.filter(
                  c => c.adminAttendance || c.attendance
                ).length;

                return (
                  <Tr
                    key={candidate._id}
                    _hover={{ bg: 'gray.50' }}
                    bg={isFamily ? 'blue.25' : 'white'}
                    borderLeft={isFamily ? '4px solid' : 'none'}
                    borderLeftColor={isFamily ? 'blue.300' : 'transparent'}
                  >
                    <Td>{idx + 1}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Text fontWeight="semibold">{candidate.name}</Text>
                        {isFamily && (
                          <Badge colorScheme="blue" size="sm">
                            Family ({familyAttended}/{familyMembers.length})
                          </Badge>
                        )}
                      </HStack>
                    </Td>
                    <Td>{candidate.gender}</Td>
                    <Td>
                      <Tooltip label={candidate.whatsappNumber} fontSize="xs">
                        <HStack spacing={1}>
                          <PhoneIcon boxSize={3} color="green.500" />
                          <Text fontSize="sm" noOfLines={1} maxW="110px">
                            {candidate.whatsappNumber}
                          </Text>
                        </HStack>
                      </Tooltip>
                    </Td>
                    <Td minW="180px">
                      <Text
                        fontSize="sm"
                        wordBreak="break-word"
                        lineHeight="1.4"
                      >
                        {candidate.college}
                      </Text>
                    </Td>
                    <Td>{candidate.branch}</Td>
                    <Td>
                      <Tooltip label={candidate.email} fontSize="xs">
                        <Text fontSize="sm" noOfLines={1} maxW="140px">
                          {candidate.email}
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td>
                      {candidate.adminAttendance || candidate.attendance ? (
                        <HStack spacing={2}>
                          <CheckCircleIcon color="green.500" />
                          <Badge colorScheme="green" size="sm">
                            Attended
                          </Badge>
                        </HStack>
                      ) : (
                        <HStack spacing={2}>
                          <WarningIcon color="orange.500" />
                          <Badge colorScheme="orange" size="sm">
                            Not Attended
                          </Badge>
                        </HStack>
                      )}
                    </Td>
                    <Td>
                      {candidate.adminAttendanceDate || candidate.attendanceDate
                        ? new Date(
                            candidate.adminAttendanceDate ||
                              candidate.attendanceDate
                          ).toLocaleString()
                        : '-'}
                    </Td>
                    <Td>
                      {candidate.registrationDate
                        ? new Date(
                            candidate.registrationDate
                          ).toLocaleDateString()
                        : '-'}
                    </Td>
                  </Tr>
                );
              })}
              {filteredData.length === 0 && (
                <Tr>
                  <Td colSpan={10}>
                    <Text color="gray.400" textAlign="center" py={10}>
                      No registration records found.
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Layout>
  );
};

export default AttendanceList;
