# Nextion Serial Protocol driver by joBr99 + nextion upload protocol 1.2 (the fast one yay) implementation using http range and tcpclient
# based on;
# Sonoff NSPanel Tasmota driver v0.47 | code by blakadder and s-hadinger
#
# Emulator driver: Tasmota on an ESP32 with the Nextion editor/simulator on the serial port
# instead of a real NSPanel. GetDriverVersion answers a negative number (= emulator), its absolute
# value is the driver generation with the same features: -12 = generation 12. The old emulator
# answered -1. There is no flashing.
#
# Changes taken over from driver generation 12 (TFT 6.1.0, display ack with crc):
#  - crc16: table-driven CRC-16 Modbus (constant table, ~5x faster than bitwise)
#  - every_100ms: frames (55 BB) are cut by their length field; an incomplete frame at the end
#    of a read is kept for one more tick and joined with the next read, then dropped
#  - CustomSend: optional precomputed CRC field '^XXXX^' (4 hex digits) at the start
#    of the payload; the field is stripped and XXXX is used as CRC without computing it.
#    The adapter sends the field to driver generation 12+, i.e. also to this emulator (-12);
#    the old emulator (-1) gets plain payloads - the driver accepts both.
#
# Changes taken over from the generations 10 and 11:
#  - every_100ms: every read is split into frames (55 BB ...), not only when it starts with 55 BB
#  - every_100ms: try/except, an exception no longer stops the driver
#  - raw traffic is logged with log level 4 (weblog 4) instead of print
#  - typo "becuase"
 
class Nextion : Driver
 
    var ser
	var flash_size
	var flash_mode
	var flash_skip
	var flash_current_byte
	var tftd
	var progress_percentage_last
    var rx_rest                # incomplete frame of the last read, nil if none
    static rx_max_len = 1024   # longer payloads are garbage, resync at the next 55 BB
	static header = bytes('55BB')

    # CRC-16 Modbus lookup table (reflected poly 0xA001), precomputed constant
    static crc_table = [
      0x0000, 0xC0C1, 0xC181, 0x0140, 0xC301, 0x03C0, 0x0280, 0xC241,
      0xC601, 0x06C0, 0x0780, 0xC741, 0x0500, 0xC5C1, 0xC481, 0x0440,
      0xCC01, 0x0CC0, 0x0D80, 0xCD41, 0x0F00, 0xCFC1, 0xCE81, 0x0E40,
      0x0A00, 0xCAC1, 0xCB81, 0x0B40, 0xC901, 0x09C0, 0x0880, 0xC841,
      0xD801, 0x18C0, 0x1980, 0xD941, 0x1B00, 0xDBC1, 0xDA81, 0x1A40,
      0x1E00, 0xDEC1, 0xDF81, 0x1F40, 0xDD01, 0x1DC0, 0x1C80, 0xDC41,
      0x1400, 0xD4C1, 0xD581, 0x1540, 0xD701, 0x17C0, 0x1680, 0xD641,
      0xD201, 0x12C0, 0x1380, 0xD341, 0x1100, 0xD1C1, 0xD081, 0x1040,
      0xF001, 0x30C0, 0x3180, 0xF141, 0x3300, 0xF3C1, 0xF281, 0x3240,
      0x3600, 0xF6C1, 0xF781, 0x3740, 0xF501, 0x35C0, 0x3480, 0xF441,
      0x3C00, 0xFCC1, 0xFD81, 0x3D40, 0xFF01, 0x3FC0, 0x3E80, 0xFE41,
      0xFA01, 0x3AC0, 0x3B80, 0xFB41, 0x3900, 0xF9C1, 0xF881, 0x3840,
      0x2800, 0xE8C1, 0xE981, 0x2940, 0xEB01, 0x2BC0, 0x2A80, 0xEA41,
      0xEE01, 0x2EC0, 0x2F80, 0xEF41, 0x2D00, 0xEDC1, 0xEC81, 0x2C40,
      0xE401, 0x24C0, 0x2580, 0xE541, 0x2700, 0xE7C1, 0xE681, 0x2640,
      0x2200, 0xE2C1, 0xE381, 0x2340, 0xE101, 0x21C0, 0x2080, 0xE041,
      0xA001, 0x60C0, 0x6180, 0xA141, 0x6300, 0xA3C1, 0xA281, 0x6240,
      0x6600, 0xA6C1, 0xA781, 0x6740, 0xA501, 0x65C0, 0x6480, 0xA441,
      0x6C00, 0xACC1, 0xAD81, 0x6D40, 0xAF01, 0x6FC0, 0x6E80, 0xAE41,
      0xAA01, 0x6AC0, 0x6B80, 0xAB41, 0x6900, 0xA9C1, 0xA881, 0x6840,
      0x7800, 0xB8C1, 0xB981, 0x7940, 0xBB01, 0x7BC0, 0x7A80, 0xBA41,
      0xBE01, 0x7EC0, 0x7F80, 0xBF41, 0x7D00, 0xBDC1, 0xBC81, 0x7C40,
      0xB401, 0x74C0, 0x7580, 0xB541, 0x7700, 0xB7C1, 0xB681, 0x7640,
      0x7200, 0xB2C1, 0xB381, 0x7340, 0xB101, 0x71C0, 0x7080, 0xB041,
      0x5000, 0x90C1, 0x9181, 0x5140, 0x9301, 0x53C0, 0x5280, 0x9241,
      0x9601, 0x56C0, 0x5780, 0x9741, 0x5500, 0x95C1, 0x9481, 0x5440,
      0x9C01, 0x5CC0, 0x5D80, 0x9D41, 0x5F00, 0x9FC1, 0x9E81, 0x5E40,
      0x5A00, 0x9AC1, 0x9B81, 0x5B40, 0x9901, 0x59C0, 0x5880, 0x9841,
      0x8801, 0x48C0, 0x4980, 0x8941, 0x4B00, 0x8BC1, 0x8A81, 0x4A40,
      0x4E00, 0x8EC1, 0x8F81, 0x4F40, 0x8D01, 0x4DC0, 0x4C80, 0x8C41,
      0x4400, 0x84C1, 0x8581, 0x4540, 0x8701, 0x47C0, 0x4680, 0x8641,
      0x8201, 0x42C0, 0x4380, 0x8341, 0x4100, 0x81C1, 0x8081, 0x4040
    ]
 
    def init()
        log("NSP: Initializing Driver")
        self.ser = serial(3, 1, 115200, serial.SERIAL_8N1)
        self.flash_mode = 0
		self.flash_skip = false
		tasmota.add_driver(self)
    end
	
    def crc16(data, poly)
      if poly && poly != 0xA001
        return self.crc16_bitwise(data, poly)
      end
      # CRC-16 MODBUS, table driven
      var t = self.crc_table
      var crc = 0xFFFF
      var n = size(data)
      var i = 0
      while i < n
        crc = (crc >> 8) ^ t[(crc ^ data[i]) & 0xFF]
        i += 1
      end
      return crc
    end

    # bitwise variant, only used for a non-default poly
    def crc16_bitwise(data, poly)
      if !poly  poly = 0xA001 end
      var crc = 0xFFFF
      for i:0..size(data)-1
        crc = crc ^ data[i]
        for j:0..7
          if crc & 1
            crc = (crc >> 1) ^ poly
          else
            crc = crc >> 1
          end
        end
      end
      return crc
    end
	
	# encode using custom protocol 55 BB [payload length] [payload length] [payload] [crc] [crc]
    def encode(payload)
      return self.encode_bytes(bytes().fromstring(payload), nil)
    end

    # pb: payload as bytes; crc: precomputed crc or nil to compute it here
    def encode_bytes(pb, crc)
      var b = bytes()
      b += self.header
      b.add(size(pb), 2)   # add size as 2 bytes, little endian
      b += pb
      if crc == nil
        crc = self.crc16(b)
      end
      b.add(crc, 2)       # crc 2 bytes, little endian
      return b
    end

    # value of an ASCII hex digit, or -1
    def hexval(c)
      if c >= 0x30 && c <= 0x39  return c - 0x30 end
      if c >= 0x41 && c <= 0x46  return c - 0x37 end
      if c >= 0x61 && c <= 0x66  return c - 0x57 end
      return -1
    end

    # payload may start with '^XXXX^' (XXXX = 4 hex digits = precomputed crc)
    def encode_custom(payload)
      var pb = bytes().fromstring(payload)
      var n = size(pb)
      if n >= 6 && pb[0] == 0x5E && pb[5] == 0x5E
        var crc = 0
        var ok = true
        for k:1..4
          var v = self.hexval(pb[k])
          if v < 0
            ok = false
            break
          end
          crc = (crc << 4) | v
        end
        if ok
          var rest = bytes()
          if n > 6
            rest = pb[6..n-1]
          end
          return self.encode_bytes(rest, crc)
        end
      end
      return self.encode_bytes(pb, nil)
    end
	
	# send a nextion payload
	def encodenx(payload)
		var b = bytes().fromstring(payload)
		b += bytes('FFFFFF')
		return b
	end
	
	def sendnx(payload)
		var payload_bin = self.encodenx(payload)
		self.ser.write(payload_bin)
		log("NSP: Nextion command sent = " + str(payload_bin), 3)
	end
  
    def send(payload)
        self.send_bin(self.encode(payload))
    end

    # CustomSend: optional precomputed crc field '^XXXX^'
    def send_custom(payload)
        self.send_bin(self.encode_custom(payload))
    end

    def send_bin(payload_bin)
        if self.flash_mode==1
            log("NSP: skipped command because still flashing", 3)
        else 
            self.ser.write(payload_bin)
            log("NSP: payload sent = " + str(payload_bin), 3)
        end
    end
		
    # receive: a frame is 55 BB [len lo] [len hi] [len bytes payload] [crc lo] [crc hi] = len + 6 bytes.
    # The length field decides where a frame ends (a 55 BB can also be in payload or crc). An
    # incomplete frame at the end of a read is kept for exactly one more every_100ms tick and put in
    # front of the next read; if it is still incomplete then, it is dropped. The crc is not checked.

    # index of the next frame start (55 BB, or a 55 as last byte) from i on, size(b) if none
    def rx_find(b, i)
      var n = size(b)
      while i < n
        if b[i] == 0x55 && (i + 1 == n || b[i+1] == 0xBB)
          return i
        end
        i += 1
      end
      return n
    end

    # a rest from the last tick and no data in this tick: the frame stays incomplete
    def rx_drop_rest()
      if self.rx_rest != nil
        log("NSP: dropped incomplete message " + str(self.rx_rest), 3)
        self.rx_rest = nil
      end
    end

    # data that is not a 55 BB frame (nextion return codes)
    def rx_other(msg)
      import string
      if msg == bytes('000000FFFFFF88FFFFFF')
        log("NSP: Screen Initialized")
      else
        var jm = string.format("{\"nextion\":\"%s\"}",str(msg[0..-4]))
        tasmota.publish_result(jm, "RESULT")
      end
    end

    # one complete 55 BB frame
    def rx_frame(msg)
      import string
      if size(msg) > 8
        var jm = string.format("{\"CustomRecv\":\"%s\"}",msg[4..-3].asstring())
        tasmota.publish_result(jm, "RESULT")
      end
    end

    def rx_feed(msg)
      import string
      var had_rest = false
      if self.rx_rest != nil
        var r = self.rx_rest
        self.rx_rest = nil
        if size(r) == 1 && msg[0] != 0xBB
          log("NSP: dropped incomplete message " + str(r), 3)
        else
          msg = r + msg
          had_rest = true
        end
      end
      var n = size(msg)
      var p = 0
      while p < n
        var q = self.rx_find(msg, p)
        if q > p
          self.rx_other(msg[p..q-1])
          p = q
        end
        if p >= n
          break
        end
        var ok = n - p >= 4
        var plen = 0
        if ok
          plen = msg[p+2] | (msg[p+3] << 8)
        end
        if ok && plen > self.rx_max_len
          q = self.rx_find(msg, p + 2)
          log(string.format("NSP: dropped message with bad length %d: %s", plen, str(msg[p..q-1])), 3)
          p = q
        elif ok && n - p >= plen + 6
          self.rx_frame(msg[p..p+plen+5])
          p += plen + 6
        elif had_rest && p == 0
          # kept since the last tick and still incomplete: drop it up to the next frame start
          q = self.rx_find(msg, 2)
          log("NSP: dropped incomplete message " + str(msg[0..q-1]), 3)
          p = q
        else
          self.rx_rest = msg[p..n-1]
          log("NSP: incomplete message kept for the next read " + str(self.rx_rest), 4)
          p = n
        end
      end
    end

    def every_100ms()
        import string
        try
            if self.ser.available() > 0
                var msg = self.ser.read()
                if size(msg) > 0
                    log(string.format("NSP: Received Raw = %s",str(msg)), 4)
                    if self.flash_mode==1
                        log("NSP: no flashing in this version")
                    else
                        # custom protocol 55 BB [payload length] [payload length] [payload] [crc] [crc]
                        self.rx_feed(msg)
                    end
                else
                    self.rx_drop_rest()
                end
            else
                self.rx_drop_rest()
            end
        except .. as e, m
            log("NSP: every_100ms EXCEPTION "+str(e)+" "+str(m), 1)
        end
    end
end
 
var nextion = Nextion()

def get_current_version(cmd, idx, payload, payload_json)
    import string
    var version_of_this_script = -12
    var jm = string.format("{\"nlui_driver_version\":\"%s\"}", version_of_this_script)
    tasmota.publish_result(jm, "RESULT")
end

tasmota.add_cmd('GetDriverVersion', get_current_version)
 
def send_cmd(cmd, idx, payload, payload_json)
    nextion.sendnx(payload)
    tasmota.resp_cmnd_done()
end
 
tasmota.add_cmd('Nextion', send_cmd)
 
def send_cmd2(cmd, idx, payload, payload_json)
    nextion.send_custom(payload)
    tasmota.resp_cmnd_done()
end
 
tasmota.add_cmd('CustomSend', send_cmd2)
