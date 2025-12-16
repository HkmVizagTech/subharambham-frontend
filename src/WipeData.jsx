import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Divider,
} from '@chakra-ui/react';
import { apiBase } from './utils/api';

const WipeData = () => {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const callEndpoint = async (method, url) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-wipe-secret': secret,
        },
      });
      let data;
      try {
        data = await res.json();
      } catch (_) {
        const text = await res.text();
        data = { message: text };
      }
      if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWipeAll = () => {
    if (!secret) {
      setError('Enter ADMIN_WIPE_SECRET');
      return;
    }
    callEndpoint('DELETE', `${apiBase}/users/admin/wipe-all`);
  };

  const handleResetAttendance = () => {
    if (!secret) {
      setError('Enter ADMIN_WIPE_SECRET');
      return;
    }
    callEndpoint('POST', `${apiBase}/users/admin/reset-attendance`);
  };

  return (
    <Box maxW="640px" mx="auto" p={6}>
      <Heading size="md" mb={2}>
        Danger Zone
      </Heading>
      <Text fontSize="sm" color="gray.500" mb={6}>
        These actions are destructive and require the correct ADMIN_WIPE_SECRET.
      </Text>

      <VStack align="stretch" spacing={4}>
        <Box>
          <Text mb={2}>Confirm Secret (ADMIN_WIPE_SECRET)</Text>
          <Input
            type="password"
            placeholder="Enter secret"
            value={secret}
            onChange={e => setSecret(e.target.value)}
          />
        </Box>

        <Divider />

        <Box>
          <Heading size="sm" mb={2}>
            Wipeout All Data
          </Heading>
          <Text mb={3}>
            Deletes all Candidate records: registrations, attendance, admin
            scanned list.
          </Text>
          <Button colorScheme="red" onClick={handleWipeAll} isLoading={loading}>
            Confirm and Delete
          </Button>
        </Box>

        <Box>
          <Heading size="sm" mb={2}>
            Reset Attendance Only
          </Heading>
          <Text mb={3}>
            Keeps registrations; clears attendance/admin scanned fields.
          </Text>
          <Button
            colorScheme="orange"
            onClick={handleResetAttendance}
            isLoading={loading}
          >
            Confirm and Reset
          </Button>
        </Box>

        {error && (
          <Alert status="error">
            <AlertIcon /> {error}
          </Alert>
        )}
        {result && (
          <Alert status="success">
            <AlertIcon /> {result.message || 'Success'}
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default WipeData;
