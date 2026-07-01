---
youtube: https://www.youtube.com/watch?v=0KmimFoalTI
---
3.480000	7.870000		A bitmap is the simplest way to represent image data.
7.980000	13.530000		In a bitmap, the image is divided into small squares called pixels.
13.710000	19.980000		This very simple image of what might be a cat consists of 256 pixels.
20.040000	23.569978		16 across and 16 down.
23.570000	27.240000		And each pixel is either black or white.
27.870000	32.040000		We can store this information using binary digits
31.817413	34.520000		by representing a black pixel with a one
34.470000	36.640000		and a white pixel with a zero.
37.103176	40.599595		With 256 pixels in this image,
40.167684	44.239984		and each pixel requiring one bit of storage,
43.808074	48.353176		this image takes up 256 bits of memory.
48.680000	54.400167		Since a byte is eight bits, that's 32 bytes of memory in total.

54.540000	58.266795		This was **pretty much**^[Almost; Nearly] all a very early computer could manage.
58.040000	62.462497		One bit per pixel meant monochrome images.
62.318527	65.670000		Not only that, but the pixels were rather large,
65.588707	67.933365		which meant poor quality images.
68.440000	70.997873		If you make the pixels smaller,
70.874470	73.324470		you can fit more of them on the screen.
73.300000	76.580000		This means you have a higher density of pixels.
77.200000	81.660000		The number of pixels per square inch is a measure of the pixel density.
81.650000	85.930000		Pixel density is commonly referred to as resolution.
85.930000	89.850000		And it's usually given in dots per inch, DPI.
90.210000	92.070000		The higher the resolution,
92.010000	94.160000		the better the quality of the image.

94.810000	99.630000		This image is 100 pixels across and 100 pixels down.
99.750000	105.010000		This means there are 100 times 100 pixels, 10,000 in total.
105.610000	108.245019		Because this is a monochrome image,
108.183318	109.293945		just one color,
109.355647	112.690000		each pixel requires only one bit of memory.
113.070000	117.270000		So this image takes up 10,000 bits of memory.
117.800000	119.750000		With eight bits in a byte,
119.720000	122.530000		that's 1,250 bytes.
122.610000	126.682580		And with 1,024 bytes in a kilobyte,
126.624407	129.790000		that's about 1.22 kilobytes of memory.

131.230000	133.450000		To display an image in color,
133.430000	137.920000		more than one bit is needed to describe the color of each pixel.
138.340000	142.470000		This image is using eight bits to describe the color of each pixel.
142.950000	146.710653		Since 2 to the power 8 is 256,
146.563901	149.755752		there are 256 possible values
149.657918	151.186582		for any given pixel.
151.186582	156.110000		In other words, each pixel can be one of 256 different colors.
156.610000	161.905896		The size of this image is also 100 pixels by 100 pixels.
161.844194	165.390000		So, there are 10,000 pixels altogether.
165.470000	169.124973		With each individual pixel taking up eight bits of memory,
169.145540	172.930000		this image requires 80,000 bits of memory altogether.
172.940000	175.397960		That's 10,000 bytes,
175.418527	179.020000		which is also 9.77 kilobytes,
178.940000	181.800000		considerably more than the monochrome image.

183.120000	186.523671		This image clearly has a higher resolution,
186.420835	190.320000		and more bits have been used to describe the color of each pixel.
190.540000	193.940000		The size of this image is 960
193.850000	196.420000		by 640 pixels.
196.420000	201.330000		And 24 bits have been used to encode the color of each pixel.
201.650000	206.741200		With 24 bits, there are 2 to the power 24 possible colors.
206.630541	210.470000		That's over 16.7 million colors.
211.020000	213.990000		Can you **work out**^[tìm ra cách giải quyết hoặc tính ra kết quả.] how much memory this image needs?
214.190000	218.494815		Pause the video now to **give it a go**^[to attempt it], and I'll show you the solution in a moment.

218.529405	220.520000		You'll probably need a calculator.
225.120000	231.500550		So, there are 960 * 640 pixels altogether.
231.388133	234.850000		That's 614,400 pixels.
235.160000	239.660000		Each individual pixel requires 24 bits of memory.
239.670000	243.900000		Or to put it another way, each pixel requires three bytes.
245.800000	253.720000		So, the whole image requires 1,843,200 bytes of memory.
253.810000	260.570000		That's 1,800 kilobytes or 1.76 megabytes.
261.040000	264.630000		This is much more typical of an image these days.

265.940000	270.920000		To summarize, the quality of a raw bitmap image depends on two things.
271.110000	275.050000		Firstly, the resolution. That's the pixel density.
275.080000	278.260000		The higher the resolution, the better it's going to look.
278.920000	281.499791		And secondly, the color depth.
281.499791	284.578276		That is the number of bits that have been used
284.552334	286.600000		to encode the color of each pixel.
287.120000	291.280034		Very early computers used one or eight bit color.
291.514183	294.662229		The images didn't look good at all by today's standards.
294.810000	297.420000		Later, came 16-bit color,
297.480000	299.210000		which was known as high color,
299.190000	302.100000		and more recently, 24-bit color.
302.340000	307.500000		These days, most images use 24 bits to describe the color of each pixel.
307.470000	312.067606		16.7 million different colors really is plenty.
311.822465	318.180000		An average pair of human eyes can't distinguish between more than about 10 million different colors.

318.700000	325.787574		When it comes to so-called 32-bit color, in fact, only 24 of the 32 bits are used for color.
325.767006	329.980000		The other eight bits are used to control the transparency of the image.
331.170000	334.050000		Of course, the better the quality of an image,
334.030000	336.460000		the more of the computer's memory it will need.

337.795212	342.505094		When an image is generated in the first place, for example, by a digital camera,
342.484527	345.865212		a rectangular array of pixels is created.
345.770000	349.090000		Some extra information is also added to the file.
349.040000	352.233366		This includes the number of pixels in each row,
352.151097	354.040000		the number of rows altogether,
354.000000	355.620000		and the color depth.
355.860000	360.851010		In addition to this essential information, other details like the shutter speed
360.686473	364.635370		and the focal depth that were used by the camera to take the picture,
364.532534	368.770000		or even details about the make and model of the camera may be included.
369.220000	376.236490		Image processing software such as Photoshop or Fireworks might also add extra data to the image file,
376.157000	378.240000		such as captions or titles.
378.660000	382.683300		All of this is data about the image data.
382.850000	386.520000		Data about data is called metadata.
386.540000	388.965956		It means that when you save an image file,
388.922327	391.423755		it'll be slightly bigger than you can calculate
391.351039	394.220000		based on the number of pixels and the color depth.
