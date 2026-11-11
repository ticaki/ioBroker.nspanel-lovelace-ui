# Sonoff NSPanel Tasmota Lovelace UI Berry Driver (improved Message Handling)| code by Armilar
# based on;
# Sonoff NSPanel Tasmota Lovelace UI Berry Driver (Extended Flashing to faster speeds; improved Error Handling)| code by joBr99
# based on;
# Sonoff NSPanel Tasmota (Nextion with Flashing) driver | code by peepshow-21
# based on;
# Sonoff NSPanel Tasmota driver v0.47 | code by blakadder and s-hadinger
#
# v12 changes:
#  - Driver-Version: 11 -> 12
#  - every_100ms: frames (55 BB) are cut by their length field; an incomplete frame at the end
#    of a read is kept for one more tick and joined with the next read, then dropped
#  - crc16: table-driven CRC-16 Modbus (constant table, ~5x faster than bitwise)
#  - CustomSend: optional precomputed CRC field '^XXXX^' (4 hex digits) at the start
#    of the payload; the field is stripped and XXXX is used as CRC without computing it
#
# v11 changes (Diagnose 2026-05-03 -> doc/diagnose_2026-05-03_final.md):
#  - Driver-Version: 10 -> 11
#  - write_block cleanup condition: == -> >= (avoids 99.99% hang on partial last block)
#  - write_block wait-loop TIMEOUT: 30s -> 60s
#  - write_block: skip partial sub-block write when TIMEOUT hits before end-of-stream
#  - every_100ms: handle 5-byte combined frame {0x08, off0, off1, off2, off3} (Patch 8)
#  - open_url_at: header-read in loop until \r\n\r\n or 3s deadline (defensive race-fix)
#  - open_url_at: hard return -1 when headers==nil or flash_size<=0
#  - try/except in write_block and every_100ms -> on exception: flash_mode=0, tcp.close()

# Example Flash
# FlashNextion http://nspanel.de/nspanel-vX.X.X.tft

class Nextion : Driver

    static header = bytes('55BB')

    static flash_block_size = 4096

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

    var flash_mode
    var flash_start_millis
    var flash_size
    var flash_written
    var flash_buff
    var flash_offset
    var flash_proto_version
    var flash_proto_baud
    var awaiting_offset
    var tcp
    var ser
    var last_per
    var url
    var _wb_count
    var rx_rest                # incomplete frame of the last read, nil if none
    static rx_max_len = 1024   # longer payloads are garbage, resync at the next 55 BB

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

    def encodenx(payload)
        var b = bytes().fromstring(payload)
        b += bytes('FFFFFF')
        return b
    end

    def sendnx(payload)
        import string
        var payload_bin = self.encodenx(payload)
        self.ser.write(payload_bin)
        log(string.format("NXP: Nextion command sent = %s",str(payload_bin)), 3)
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
            log("NXP: skipped command because still flashing", 3)
        else
            self.ser.write(payload_bin)
            log("NXP: payload sent = " + str(payload_bin), 3)
        end
    end

    def write_to_nextion(b)
        self.ser.write(b)
    end

    def screeninit()
        log("NXP: Screen Initialized")
        self.sendnx("recmod=1")
    end

    def write_block()
        import string
        try
            # diagnose-only ENTER-sample (auskommentiert nach v11-Verifikation 2026-05-04)
            #if self._wb_count == nil  self._wb_count = 0  end
            #self._wb_count += 1
            #if self._wb_count % 100 == 1
            #    log(string.format("FLH: write_block ENTER #%d buf=%d written=%d size=%d tcp_conn=%s avail=%d",
            #        self._wb_count, size(self.flash_buff), self.flash_written, self.flash_size,
            #        str(self.tcp.connected()), self.tcp.available()), 3)
            #end
            var wait_iters = 0
            var wait_start = tasmota.millis()
            var timed_out = false
            while size(self.flash_buff)<self.flash_block_size && self.tcp.connected()
                if self.tcp.available()>0
                    self.flash_buff += self.tcp.readbytes(4096)
                else
                    wait_iters += 1
                    tasmota.delay(50)
                    #log("FLH: Wait for available...",4)
                    if tasmota.millis() - wait_start > 60000
                        log(string.format("FLH: TIMEOUT in wait loop after %d iters, buf=%d, forcing exit",
                            wait_iters, size(self.flash_buff)), 2)
                        timed_out = true
                        break
                    end
                end
            end
            # diagnose-only waited-iters sample (auskommentiert)
            #if wait_iters > 100
            #    log(string.format("FLH: waited %d iters (%d ms) for tcp data, buf=%d tcp_conn=%s",
            #        wait_iters, tasmota.millis()-wait_start, size(self.flash_buff), str(self.tcp.connected())), 3)
            #end
            var to_write
            if size(self.flash_buff)>self.flash_block_size
                to_write = self.flash_buff[0..self.flash_block_size-1]
                self.flash_buff = self.flash_buff[self.flash_block_size..]
            else
                # Sub-block write only allowed when:
                #  - we did NOT timeout, OR
                #  - this really is the end of the stream (would complete the flash)
                # Otherwise: skip — Nextion-Bootloader expects full 4096 blocks and would
                # ignore/queue a partial block, leaving us stuck.
                var is_end_of_stream = (self.flash_written + size(self.flash_buff)) >= self.flash_size
                if timed_out && !is_end_of_stream
                    log(string.format("FLH: skip partial write after TIMEOUT (buf=%d, remaining=%d)",
                        size(self.flash_buff), self.flash_size - self.flash_written), 2)
                    return
                end
                to_write = self.flash_buff
                self.flash_buff = bytes()
            end
            var per = (self.flash_written*100)/self.flash_size
            if (self.last_per!=per)
                self.last_per = per
                tasmota.publish_result(string.format("{\"Flashing\":{\"complete\": \"%d\", \"time_elapsed\": %d}}",per , (tasmota.millis()-self.flash_start_millis)/1000), "RESULT")
            end
            if size(to_write)>0
                self.flash_written += size(to_write)
                self.ser.write(to_write)
            end
            log("FLH: Read block - Writing: "+str(size(to_write))+" - Total: "+str(self.flash_written)+" - Buffer size: "+str(size(self.flash_buff)) ,3)
            # diagnose-only EXIT-sample (auskommentiert)
            #if self._wb_count != nil && self._wb_count % 100 == 1
            #    log(string.format("FLH: write_block EXIT #%d remain=%d tcp_conn=%s",
            #        self._wb_count, self.flash_size - self.flash_written, str(self.tcp.connected())), 3)
            #end
            if self.flash_written > self.flash_size
                self.flash_written = self.flash_size
            end
            if (self.flash_written>=self.flash_size)
                tasmota.delay(25)
                log("FLH: Flashing complete - Time elapsed: %d", (tasmota.millis()-self.flash_start_millis)/1000)
                tasmota.publish_result(string.format("{\"Flashing\":{\"complete\": \"done\", \"time_elapsed\": %d}}", (tasmota.millis()-self.flash_start_millis)/1000), "RESULT")
                tasmota.cmd('RuleTimer3 120')
                tasmota.cmd('Rule3 1')
                tasmota.delay(50)
                self.flash_mode = 0
                self.ser.deinit()
                self.ser = serial(17, 16, 115200, serial.SERIAL_8N1)
            end
        except .. as e, m
            log("FLH: write_block EXCEPTION "+str(e)+" "+str(m), 1)
            self.flash_mode = 0
            if self.tcp != nil
                self.tcp.close()
            end
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
        log("NXP: dropped incomplete message " + str(self.rx_rest), 3)
        self.rx_rest = nil
      end
    end

    # data that is not a 55 BB frame (nextion return codes)
    def rx_other(msg)
      import string
      if msg == bytes('000000FFFFFF88FFFFFF')
        self.screeninit()
      elif msg[0]==0x07 && size(msg)==1 # BELL/Buzzer
        tasmota.cmd("buzzer 1,1")
      else
        var jm = string.format("{\"nextion\":\"%s\"}",str(msg[0..-4]))
        tasmota.publish_result(jm, "RESULT")
      end
    end

    # one complete 55 BB frame
    def rx_frame(msg)
      import string
      var jm = string.format("{\"CustomRecv\":\"%s\"}",msg[4..-3].asstring())
      tasmota.publish_result(jm, "RESULT")
    end

    def rx_feed(msg)
      import string
      var had_rest = false
      if self.rx_rest != nil
        var r = self.rx_rest
        self.rx_rest = nil
        if size(r) == 1 && msg[0] != 0xBB
          log("NXP: dropped incomplete message " + str(r), 3)
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
          log(string.format("NXP: dropped message with bad length %d: %s", plen, str(msg[p..q-1])), 3)
          p = q
        elif ok && n - p >= plen + 6
          self.rx_frame(msg[p..p+plen+5])
          p += plen + 6
        elif had_rest && p == 0
          # kept since the last tick and still incomplete: drop it up to the next frame start
          q = self.rx_find(msg, 2)
          log("NXP: dropped incomplete message " + str(msg[0..q-1]), 3)
          p = q
        else
          self.rx_rest = msg[p..n-1]
          log("NXP: incomplete message kept for the next read " + str(self.rx_rest), 4)
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
                    log(string.format("NXP: Received Raw = %s",str(msg)), 4)
                    if (self.flash_mode==1)
                        var strv = msg[0..-4].asstring()
                        if string.find(strv,"comok 2")>=0
                            tasmota.delay(20)
                            log("FLH: Send (High Speed) flash start")
                            self.flash_start_millis = tasmota.millis()
                            if self.flash_proto_version == 0
                                self.sendnx(string.format("whmi-wri %d,%d,res0",self.flash_size,self.flash_proto_baud))
                            else
                                self.sendnx(string.format("whmi-wris %d,%d,res0",self.flash_size,self.flash_proto_baud))
                            end
                            if self.flash_proto_baud != 115200
                                tasmota.delay(20)
                                self.ser.deinit()
                                self.ser = serial(17, 16, self.flash_proto_baud, serial.SERIAL_8N1)
                            end
                        elif size(msg)==1 && msg[0]==0x08
                            log("FLH: Waiting offset...",3)
                            self.awaiting_offset = 1
                        elif size(msg)==4 && self.awaiting_offset==1
                            self.awaiting_offset = 0
                            self.flash_offset = msg.get(0,4)
                            log("FLH: Flash offset marker "+str(self.flash_offset),3)
                            if self.flash_offset != 0
                                self.open_url_at(self.url, self.flash_offset)
                                self.flash_written = self.flash_offset
                            end
                            self.write_block()
                        elif size(msg)==5 && msg[0]==0x08
                            # Patch 8: 5-byte combined frame {0x08, off0..off3}
                            self.awaiting_offset = 0
                            self.flash_offset = msg[1..4].get(0,4)
                            log("FLH: Flash offset marker (combined 5B) "+str(self.flash_offset),3)
                            if self.flash_offset != 0
                                self.open_url_at(self.url, self.flash_offset)
                                self.flash_written = self.flash_offset
                            end
                            self.write_block()
                        elif size(msg)==1 && msg[0]==0x05
                            self.write_block()
                        else
                            log(string.format("FLH: UNKNOWN display response in flash_mode (size=%d, hex=%s)",
                                size(msg), str(msg)), 2)
                            if self.flash_size > 0
                                var per_done = (self.flash_written * 100) / self.flash_size
                                if per_done >= 99
                                    log(string.format("FLH: late-stage unknown msg at %d%% (written=%d size=%d)",
                                        per_done, self.flash_written, self.flash_size), 2)
                                end
                            end
                        end
                    else
                        self.rx_feed(msg)
                    end
                else
                    self.rx_drop_rest()
                end
            else
                self.rx_drop_rest()
            end
        except .. as e, m
            log("FLH: every_100ms EXCEPTION "+str(e)+" "+str(m), 1)
            if self.flash_mode == 1
                self.flash_mode = 0
                if self.tcp != nil
                    self.tcp.close()
                end
            end
        end
    end

    def begin_nextion_flash()
        tasmota.cmd('RuleTimer3 0')
        tasmota.cmd('Rule3 0')
        self.flash_written = 0
        self.awaiting_offset = 0
        self.flash_offset = 0
        self.sendnx('DRAKJHSUYDGBNCJHGJKSHBDN')
        self.sendnx('recmod=0')
        self.rx_rest = nil
        self.flash_mode = 1
        self.sendnx("connect")
    end

    def open_url_at(url, pos)
        self.url = url
        import string
        var host
        var port
        var s1 = string.split(url,7)[1]
        var i = string.find(s1,":")
        var sa
        if i<0
            port = 80
            i = string.find(s1,"/")
            sa = string.split(s1,i)
            host = sa[0]
        else
            sa = string.split(s1,i)
            host = sa[0]
            s1 = string.split(sa[1],1)[1]
            i = string.find(s1,"/")
            sa = string.split(s1,i)
            port = int(sa[0])
        end
        var get = sa[1]
        log(string.format("FLH: host: %s, port: %s, get: %s",host,port,get))
        self.tcp = tcpclient()
        self.tcp.connect(host,port)
        log("FLH: Connected:"+str(self.tcp.connected()),3)
        var get_req = "GET "+get+" HTTP/1.0\r\n"
        get_req += string.format("Range: bytes=%d-\r\n", pos)
        get_req += string.format("HOST: %s:%s\r\n\r\n",host,port)
        self.tcp.write(get_req)

        # v11 defensive: read in loop until \r\n\r\n marker found or 3s deadline
        var b = bytes()
        var deadline = tasmota.millis() + 3000
        var headers
        var header_end = -1
        while tasmota.millis() < deadline && headers == nil
            if self.tcp.available() > 0
                b += self.tcp.readbytes()
                var k = 0
                while k <= size(b) - 4 && headers == nil
                    if b[k..(k+3)] == bytes().fromstring("\r\n\r\n")
                        headers = b[0..(k+3)].asstring()
                        self.flash_buff = b[(k+4)..]
                        header_end = k
                    end
                    k += 1
                end
            else
                tasmota.delay(50)
            end
        end
        # diagnose-only header-bytes trace (auskommentiert)
        #log(string.format("FLH: header read total bytes %d", size(b)), 3)
        if headers == nil
            var preview_len = size(b)
            if preview_len > 120  preview_len = 120  end
            if preview_len > 0
                log(string.format("FLH: NO header marker in %d bytes; first %d as string: %s",
                    size(b), preview_len, b[0..preview_len-1].asstring()), 2)
            else
                log("FLH: NO header marker, no bytes read at all", 2)
            end
            log("FLH: HTTP header incomplete - aborting", 2)
            self.tcp.close()
            return -1
        end
        # diagnose-only header-found trace (auskommentiert)
        #log(string.format("FLH: header found at byte %d (header=%d B, body remainder=%d B)",
        #    header_end, size(headers), size(self.flash_buff)), 3)
        # check http response for code 200/206
        if string.find(headers,"200 OK")>0 || string.find(headers,"206 Partial Content")>0
            log("FLH: HTTP Respose is 200 OK or 206 Partial Content",3)
        else
            log("FLH: HTTP Respose is not 200 OK or 206 Partial Content",3)
            print(headers)
            self.tcp.close()
            return -1
        end
        # only set flash size if pos is zero
        if pos == 0
            # check http response for content-length
            var tag = "Content-Length: "
            i = string.find(headers,tag)
            # diagnose-only Content-Length-Parse trace (auskommentiert)
            #log(string.format("FLH: find('Content-Length: ') = %d", i), 3)
            if (i>0)
                var i2 = string.find(headers,"\r\n",i)
                var s = headers[i+size(tag)..i2-1]
                #log(string.format("FLH: content-length slice = '%s' (len=%d)", s, size(s)), 3)
                self.flash_size=int(s)
                #log(string.format("FLH: int(s) = %d", self.flash_size), 3)
            end
            log("FLH: Flash file size: "+str(self.flash_size),3)
            # v11 hard guard: never proceed with bogus size
            if self.flash_size == nil || self.flash_size <= 0
                log("FLH: Content-Length missing or zero - aborting", 2)
                self.tcp.close()
                return -1
            end
        end
    end

    def flash_nextion(url)
        self.flash_size = 0
        var res = self.open_url_at(url, 0)
        if res != -1
            self.begin_nextion_flash()
        end
    end

    def init()
        log("NXP: Initializing Driver")
        self.ser = serial(17, 16, 115200, serial.SERIAL_8N1)
        self.flash_mode = 0
        self.flash_proto_version = 1
        self.flash_proto_baud = 921600
        self._wb_count = 0
    end

end

var nextion = Nextion()

tasmota.add_driver(nextion)

def get_current_version(cmd, idx, payload, payload_json)
    import string
    var version_of_this_script = 12
    var jm = string.format("{\"nlui_driver_version\":\"%s\"}", version_of_this_script)
    tasmota.publish_result(jm, "RESULT")
end

tasmota.add_cmd('GetDriverVersion', get_current_version)

def update_berry_driver(cmd, idx, payload, payload_json)
    def task()
        import path
        import string
		if string.find(payload, ".tapp") > 0
		    print("tapp in URL; will do .tapp update and migration if necessary")

			if path.exists("autoexec.be")
			    print("autoexec.be found; will check for migration")
				var autoexecfile = open('autoexec.be')
				var line = autoexecfile.readline()
				autoexecfile.close()
				if string.find(line, "NSPanel Tasmota Lovelace UI Berry Driver") > 0
			        print("found lovelace berry driver, going to delete autoexec.be and .bec")
					path.remove("autoexec.be")
					path.remove("autoexec.bec")
				end
			end

			var r = tasmota.urlfetch(payload, "nsp-lovelace-driver.tapp")
            if r < 0
                print("Update failed")
            else
                tasmota.cmd("Restart 1")
            end

		elif string.find(payload, ".be") > 0
		    print("be in URL; will do .be update")
			if path.exists("nsp-lovelace-driver.tapp")
			    print("Error: there is the tapp version of the berry driver installed; cannot do .be update.")
			else
                var cl = webclient()
                cl.begin(payload)
                var r = cl.GET()
                if r == 200
                    print("Sucessfully downloaded nspanel-lovelace-ui berry driver")
                else
                    print("Error while downloading nspanel-lovelace-ui berry driver")
                end
                r = cl.write_file("autoexec.be")
                if r < 0
                    print("Error while writeing nspanel-lovelace-ui berry driver")
                else
                    print("Sucessfully written nspanel-lovelace-ui berry driver")
                    tasmota.cmd("Restart 1")
                end
			end
		else
			print("invalid url filetype")
		end



        if path.exists("nsp-lovelace-driver.tapp")
            var r = string.find(payload, ".tapp")
            if r < 0
                print("URL doesn't contain .tapp skipping update")
            else

            end
        else
            var r = string.find(payload, ".be")
            if r < 0
                print("URL doesn't contain .be skipping update")
            else

            end
        end
    end
    tasmota.set_timer(0,task)
    tasmota.resp_cmnd_done()
end

tasmota.add_cmd('UpdateDriverVersion', update_berry_driver)

def flash_nextion(cmd, idx, payload, payload_json)
    def task()
    nextion.flash_proto_version = 1
    nextion.flash_proto_baud = 921600
        nextion.flash_nextion(payload)
    end
    tasmota.set_timer(0,task)
    tasmota.resp_cmnd_done()
end

def flash_nextion_adv(cmd, idx, payload, payload_json)
    def task()
        if idx==0
            nextion.flash_proto_version = 1
            nextion.flash_proto_baud = 921600
        elif idx==1
            nextion.flash_proto_version = 0
            nextion.flash_proto_baud = 921600
        elif idx==2
            nextion.flash_proto_version = 1
            nextion.flash_proto_baud = 115200
        elif idx==3
            nextion.flash_proto_version = 0
            nextion.flash_proto_baud = 115200
        elif idx==4
            nextion.flash_proto_version = 1
            nextion.flash_proto_baud = 256000
        elif idx==5
            nextion.flash_proto_version = 0
            nextion.flash_proto_baud = 256000
        elif idx==6
            nextion.ser.deinit()
            nextion.ser = serial(17, 16, 9600, serial.SERIAL_8N1)
            nextion.flash_proto_version = 0
            nextion.flash_proto_baud = 921600
        else
            nextion.flash_proto_version = 0
            nextion.flash_proto_baud = 115200
        end

        nextion.flash_nextion(payload)
    end
    tasmota.set_timer(0,task)
    tasmota.resp_cmnd_done()
end

def send_cmd(cmd, idx, payload, payload_json)
    nextion.sendnx(payload)
    tasmota.resp_cmnd_done()
end

def send_cmd2(cmd, idx, payload, payload_json)
    nextion.send_custom(payload)
    tasmota.resp_cmnd_done()
end

tasmota.add_cmd('Nextion', send_cmd)
tasmota.add_cmd('CustomSend', send_cmd2)
tasmota.add_cmd('FlashNextion', flash_nextion)
tasmota.add_cmd('FlashNextionAdv', flash_nextion_adv)
