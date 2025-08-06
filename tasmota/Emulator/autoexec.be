# Nextion Serial Protocol driver by joBr99 + nextion upload protocol 1.2 (the fast one yay) implementation using http range and tcpclient
# based on;
# Sonoff NSPanel Tasmota driver v0.47 | code by blakadder and s-hadinger
 
class Nextion : Driver
 
    var ser
	var flash_size
	var flash_mode
	var flash_skip
	var flash_current_byte
	var tftd
	var progress_percentage_last
	static header = bytes('55BB')
 
    def init()
        log("NSP: Initializing Driver")
        self.ser = serial(3, 1, 115200, serial.SERIAL_8N1)
        self.flash_mode = 0
		self.flash_skip = false
		tasmota.add_driver(self)
    end
	
    def crc16(data, poly)
      if !poly  poly = 0xA001 end
      # CRC-16 MODBUS HASHING ALGORITHM
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
	
    def split_55(b)
      var ret = []
      var s = size(b)   
      var i = s-2   # start from last
      while i > 0
        if b[i] == 0x55 && b[i+1] == 0xBB           
          ret.push(b[i..s-1]) # push last msg to list
          b = b[(0..i-1)]   # write the rest back to b
        end
        i -= 1
      end
      ret.push(b)
      return ret
    end
 
	# encode using custom protocol 55 BB [payload length] [payload] [crc] [crc]
    def encode(payload)
      var b = bytes()
      b += self.header
      b.add(size(payload), 2)   # add size as 1 byte
      b += bytes().fromstring(payload)
      var msg_crc = self.crc16(b)
      b.add(msg_crc, 2)       # crc 2 bytes, little endian
      return b
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
		 print("NSP: Sent =", payload_bin)
		log("NSP: Nextion command sent = " + str(payload_bin), 3)
	end
  
    def send(payload)
        var payload_bin = self.encode(payload)
        if self.flash_mode==1
            log("NSP: skipped command becuase still flashing", 3)
        else 
            self.ser.write(payload_bin)
            log("NSP: payload sent = " + str(payload_bin), 3)
        end
    end
		
	def every_100ms()
        import string
        if self.ser.available() > 0
            var msg = self.ser.read()
            if size(msg) > 0
                print("NSP: Received Raw =", msg)
                if self.flash_mode==1
                    log("no flashing in this version")
                else
					# Recive messages using custom protocol 55 BB [payload length] [payload length] [payload] [crc] [crc]
					if msg[0..1] == self.header
						var lst = self.split_55(msg)
						for i:0..size(lst)-1
							msg = lst[i]
							#var j = msg[2]+2
							var j = size(msg) - 3
							msg = msg[4..j]
							if size(msg) > 2
								var jm = string.format("{\"CustomRecv\":\"%s\"}",msg.asstring())
								tasmota.publish_result(jm, "RESULT")
							end
						end
					elif msg == bytes('000000FFFFFF88FFFFFF')
						log("NSP: Screen Initialized")
					else
                        var jm = string.format("{\"nextion\":\"%s\"}",str(msg[0..-4]))
						tasmota.publish_result(jm, "RESULT")
					end       			
                end
            end
        end
    end
end
 
var nextion = Nextion()

def get_current_version(cmd, idx, payload, payload_json)
    import string
    var version_of_this_script = -1
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
    nextion.send(payload)
    tasmota.resp_cmnd_done()
end
 
tasmota.add_cmd('CustomSend', send_cmd2)
