import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useToast } from '@chakra-ui/react';
import { api } from './utils/api';

const SuccessIcon = () => (
  <span
    style={{
      color: '#21cc51',
      fontSize: '1.5em',
      verticalAlign: 'middle',
      marginRight: 6,
    }}
  >
    ✔️
  </span>
);
const WarningIcon = () => (
  <span
    style={{
      color: '#ff6b6b',
      fontSize: '1.5em',
      verticalAlign: 'middle',
      marginRight: 6,
    }}
  >
    ⚠️
  </span>
);

const AdminQrScanner = () => {
  const videoRef = useRef(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [scannedBy, setScannedBy] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const toast = useToast();

  const lastScanRef = useRef({ value: '', time: 0 });

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .listVideoInputDevices()
      .then(videoInputDevices => {
        if (videoInputDevices.length === 0) {
          setError('No camera device found.');
          return;
        }
        const selectedDeviceId = videoInputDevices[0].deviceId;

        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          async (res, err) => {
            if (res) {
              const scannedText = res.getText();
              setResult(scannedText);
              setError('');
              setStatus('');
              setMessage('');
              setFamilyMembers([]);
              setTotalMembers(0);
              setScannedBy('');

              const now = Date.now();
              if (
                scannedText !== lastScanRef.current.value ||
                now - lastScanRef.current.time > 1500
              ) {
                lastScanRef.current = { value: scannedText, time: now };
                toast({
                  title: 'QR Code Scanned',

                  status: 'success',
                  duration: 1800,
                  isClosable: true,
                  position: 'top',
                });
              }

              try {
                console.log('📱 Sending QR token to backend:', scannedText);
                // token handled by api helper

                const res = await api.post('/users/admin/attendance-scan', {
                  token: scannedText,
                });

                const response = await res.json();
                console.log('✅ Backend response:', response);

                if (
                  response.familyMembers &&
                  response.familyMembers.length > 0
                ) {
                  // New format: multiple family members
                  setFamilyMembers(response.familyMembers);
                  setTotalMembers(
                    response.totalMembers || response.familyMembers.length
                  );
                  setScannedBy(response.scannedPerson || '');
                  setStatus(response.status);
                  setMessage(response.message);
                } else if (response.data) {
                  // Single candidate format (backward compatibility)
                  setFamilyMembers([response.data]);
                  setTotalMembers(1);
                  setScannedBy(response.data.name || '');
                  setStatus(response.status);
                  setMessage(response.message);
                }
                setStatus(response.status);
                setMessage(response.message);
              } catch (e) {
                console.error(
                  ' Error scanning QR:',
                  e.response?.data || e.message
                );

                // Handle authentication errors
                if (e.response?.status === 401 || e.response?.status === 403) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('role');
                  window.location.href = '/admin/login';
                  return;
                }

                setFamilyMembers([]);
                setTotalMembers(0);
                setScannedBy('');
                setStatus('');
                setMessage('');
                setError(
                  e.response?.data?.message ||
                    e.message ||
                    'Error fetching candidate details'
                );
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              setError(err.message || 'QR scan error');
            }
          }
        );
      })
      .catch(err => setError(err.message));

    return () => {
      codeReader.reset();
    };
  }, [toast]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f3f5f9 0%, #e9ecef 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '18px',
          boxShadow: '0 6px 30px 0 rgba(0,0,0,0.15)',
          padding: '32px 28px 40px 28px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            marginBottom: '18px',
            letterSpacing: '0.5px',
            color: '#222',
          }}
        >
          Admin QR Scanner
        </h2>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            maxWidth: '360px',
            height: 'auto',
            borderRadius: '12px',
            border: '4px solid #e5eaf2',
            marginBottom: '26px',
            boxShadow: '0 2px 12px 0 rgba(44,62,80,0.07)',
          }}
        />
        {result && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: '1.1em',
              marginBottom: '16px',
              color: '#222',
            }}
          >
            <SuccessIcon />
            {/* <span>QR Code: <span style={{ fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.5px" }}>{result}</span></span> */}
          </div>
        )}
        {familyMembers.length > 0 && (
          <div
            style={{
              marginBottom: '18px',
              width: '100%',
              background: '#f7fafd',
              borderRadius: '12px',
              boxShadow: '0 1.5px 6px 0 rgba(33, 204, 81, 0.04)',
              padding: '18px 16px',
              fontSize: '1.08em',
              color: '#2d3748',
            }}
          >
            <div
              style={{ marginBottom: 12, fontWeight: 'bold', color: '#20603d' }}
            >
              {totalMembers === 1
                ? 'Registration Details:'
                : `Family Registration (${totalMembers} members):`}
            </div>
            {scannedBy && (
              <div
                style={{ marginBottom: 8, fontSize: '0.9em', color: '#666' }}
              >
                QR Code scanned by: <strong>{scannedBy}</strong>
              </div>
            )}
            {familyMembers.map((member, index) => (
              <div
                key={member.id || index}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: index < familyMembers.length - 1 ? '10px' : '0',
                  backgroundColor: member.wasAlreadyScanned
                    ? '#fff3cd'
                    : '#d4edda',
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <strong>Name:</strong> {member.name}
                  {member.wasAlreadyScanned && (
                    <span
                      style={{
                        marginLeft: '8px',
                        backgroundColor: '#ffc107',
                        color: '#856404',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75em',
                        fontWeight: 'bold',
                      }}
                    >
                      ALREADY SCANNED
                    </span>
                  )}
                  {!member.wasAlreadyScanned && (
                    <span
                      style={{
                        marginLeft: '8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75em',
                        fontWeight: 'bold',
                      }}
                    >
                      NEW SCAN
                    </span>
                  )}
                </div>
                {member.email && (
                  <div style={{ marginBottom: 4, fontSize: '0.9em' }}>
                    <strong>Email:</strong> {member.email}
                  </div>
                )}
                {member.gender && (
                  <div style={{ marginBottom: 4, fontSize: '0.9em' }}>
                    <strong>Gender:</strong> {member.gender}
                  </div>
                )}
                {member.college && (
                  <div style={{ marginBottom: 4, fontSize: '0.9em' }}>
                    <strong>College/Company:</strong> {member.college}
                  </div>
                )}
                {member.course && member.year && (
                  <div style={{ fontSize: '0.9em' }}>
                    <strong>Course:</strong> {member.course} - {member.year}
                    {member.year === '1'
                      ? 'st'
                      : member.year === '2'
                      ? 'nd'
                      : member.year === '3'
                      ? 'rd'
                      : 'th'}{' '}
                    Year
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {message && (
          <div
            style={{
              color: status === 'already-marked' ? '#f44336' : '#21cc51',
              fontWeight: 700,
              fontSize: '1.05em',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {status === 'already-marked' ? <WarningIcon /> : <SuccessIcon />}
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div
            style={{
              color: '#f44336',
              fontWeight: 600,
              marginTop: '18px',
              fontSize: '1em',
            }}
          >
            <WarningIcon />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQrScanner;
