---
youtube: https://www.youtube.com/watch?v=cwHPuU3sHOk
---
2.160000	4.707821		In the previous video of this series,
4.590544	9.400000		you saw that a bitmap is a rectangular grid of cells called pixels.
9.566426	12.956426		A bitmap image is also known as a raster image.
13.420000	17.320000		There are three fundamental properties of a bitmap image:
17.480000	24.570000		the number of pixels, which can be calculated by multiplying the width in pixels by the height in pixels.
24.770000	28.967338		The resolution, which depends on the size of the pixels.
29.000845	32.787207		The smaller the pixels, the greater the density of pixels,
32.753699	36.460000		so the higher the resolution and the better the quality of the image.
36.710000	39.970000		Resolution is measured in dots per inch.
40.820000	46.830000		The color depth. That's the number of bits used to encode the color of each pixel.
46.810000	52.080000		More bits per pixel means that more different colors can be used in the image if necessary.

52.720000	54.880000		With eight bits per pixel,
54.810000	61.060000		a bitmap can have up to 2 to the power 8, that's 256 different colors.
61.370000	64.130000		This 8-bit image looks pretty good,
64.060000	67.580000		but you might have noticed some banding in the sky.
68.360000	75.140000		In the previous video of this series, you also saw that we can calculate the amount of memory a bitmap needs
75.080000	77.780000		by multiplying the number of pixels
77.730000	80.740000		by the number of bits allocated to each pixel.
81.150000	89.930000		For example, a bitmap measuring 960 by 640 pixels with a color depth of 8 bits per pixel
89.910000	92.960000		will take up 600 kilobytes of memory.

94.520000	102.310000		The simplest type of bitmap is saved to secondary storage as a two-dimensional array of pixel data.
102.500000	107.080000		Each and every pixel is given a number to encode its color.
107.380000	111.620000		When the color of each and every pixel in an image is encoded separately,
111.700000	114.340000		it's known as a true color image.
114.500000	120.420000		Of course, with true color, lots of pixels in an image may well have exactly the same color code.
121.000000	129.020000		A small amount of metadata also needs to be saved for the benefit of any software that needs to interpret and display the image.
129.050000	134.114251		This will include the width and height in pixels and the all-important color depth,
134.080743	138.580000		so the software knows where the information about one particular pixel begins
138.520000	139.890000		and where it ends.

140.910000	145.310000		When 24 bits are used to encode the color of each pixel,
145.300000	148.522528		there can be as many as 2 to the power of 24.
148.556035	152.878518		That's 16.7 million different colors.
153.260000	159.280000		Notice that the banding in the sky is no longer visible in this 24-bit RGB image.
159.340000	161.440000		The quality is much better.
162.340000	169.320000		Describing the color of each pixel with 24 bits depends on a fundamental principle of light.
169.410000	179.340000		Namely, that you can make pretty much any color you need, including white, by mixing together different amounts of the primary colors: red, green, and blue.
179.340000	181.670000		Hence the term RGB.
182.060000	191.310000		If you've ever seen a rainbow in the sky, then you've seen white light being split into a spectrum of different colors, in essence, the opposite effect.

191.930000	198.570000		In fact, your computer screen relies on this principle because it too is made up of pixels.
198.660000	207.280000		When magnified, each screen pixel can be seen to consist of three tiny lights: one red, one green, and one blue.
207.400000	213.660000		These lights are controlled independently for each screen pixel to create the illusion of a single color.
214.510000	221.000000		In a 24-bit RGB bitmap, the amount of red, green, and blue in each pixel
220.910000	222.530000		are encoded separately.
222.690000	226.150000		Each of these three colors is known as a channel.
226.470000	232.010000		This means you can think of an RGB image as three separate bitmaps combined together.
232.220000	237.160000		One with all the different intensities of red, one with all of the intensities of green,
237.070000	238.500000		and one with all the blue.
238.760000	242.960000		What you actually see is a combination of the three channels.
243.850000	250.921816		Some graphics applications, such as Photoshop, will let you view the three channels that make up an image separately,
250.905062	253.180000		or in different combinations.

254.710000	256.560000		When saved as a file,
256.620000	260.310000		three separate values are stored for each pixel
260.240000	263.110000		to encode the different amounts of red, green, and blue.
263.440000	267.800000		For each pixel, eight bits are used to encode the amount of red,
267.730000	273.330000		eight bits are used to encode the amount of green, and eight bits are used to encode the amount of blue.
273.550000	275.952008		This means that for each pixel,
275.952008	282.800000		the amount of red has a denary value between 0 and 255, as do the amounts of green and blue.
282.720000	294.020000		With eight bits per channel per pixel, the total number of possible color combinations is 255 times 255 times 255,
294.090000	297.940000		which is indeed 16.7 million colors.
299.390000	307.482679		Sometimes, when people talk about 8-bit color, they actually mean 8 bits per channel, not 8 bits per pixel.
307.549694	314.318233		This of course can lead to some confusion. 8 bits per channel is actually 24 bits per pixel.
315.080000	325.180000		A wide range of application software, graphics packages, HTML, and style sheets express colors using hexadecimal codes.
325.780000	331.758950		A color code is simply the red value, followed by the green value, followed by the blue value,
331.758950	336.684570		each expressed as a two-digit hexadecimal number for compactness.

337.380000	338.850000		As said before,
338.860000	344.690000		when the red, green, and blue values of each and every pixel is encoded individually,
344.600000	348.380000		as they have been in this 24-bit RGB image,
348.530000	351.009078		this is known as true color.
352.520000	360.560000		But a bitmap can also be saved, usually more efficiently, by using indexed color instead of true color.
361.720000	367.595350		In this method, a color table known as a palette is included in the image file.
367.920000	376.670000		Each color in the palette has an index number, and information about each pixel is simply a reference to one of the colors in this table.
377.090000	384.181622		In this example, the palette has only 16 colors, which means that a maximum of only four bits is required
384.148114	390.720000		to encode the color of each pixel instead of the 24 bits required for the equivalent true color image.
391.340000	396.445411		When an indexed color image is saved, the palette does take up some space as well.
396.462165	398.973508		It's part of the image file's metadata.
399.230000	402.700000		But with larger images and higher resolutions,
402.640000	406.279898		the size of the palette itself becomes insignificant.

407.520000	414.180000		The beauty of indexed color is that the palette only needs to contain the colors that are used in the image.
414.340000	423.660000		This means you can get very good quality images with only eight bits per pixel. That is, a maximum of 256 different colors.
424.170000	435.100000		Most image editing applications will let you save an image as an indexed bitmap and will generate an optimal palette for you, containing only the colors from the image you're saving.
435.200000	437.900000		This is called an adaptive palette.
438.890000	445.920000		Another type of indexed color palette includes only 216 web-safe colors.
446.110000	456.650000		Although eight bits allows for up to 256 different colors, only 216 of them are likely to look the same in any browser on most computer screens.
456.840000	462.170000		Saving an image with a web-safe palette will help to ensure consistency of appearance.
462.590000	471.580000		However, when you take an image containing millions or even thousands of colors and resave it with a much smaller set of colors to choose from,
471.500000	474.950000		you're bound to lose some of the color information.
475.170000	479.200000		The resaved image can't possibly look as good as the original.
479.840000	483.200000		In an attempt to maintain the quality of the image,
483.260000	487.670000		the image editing software can apply a process known as dithering.
487.850000	491.104439		This is also called color quantization.
491.630000	499.630000		Dithering works by putting colors that are available next to each other in a way that creates the illusion of colors that are not available.
499.700000	504.290000		For example, suppose an image was using a palette without orange in it.
504.330000	509.360000		To create the illusion of orange, red and yellow pixels can be matched like this.
509.400000	511.640000		As long as the pixels are small enough,
511.600000	513.700000		the human eye will be deceived.
514.230000	520.070000		However, dithered images tend to have a grainy or speckled appearance when viewed up close.

522.180000	528.680000		Resaving a 24-bit RGB true color image as an indexed bitmap
528.690000	531.270000		will usually make the image file smaller.
531.340000	536.690000		So this is one method you can use to effectively compress a bitmap image file.
537.160000	543.540000		Perhaps you want it to download more quickly from your web page, or you're just short of disk space.
544.080000	550.010836		Resaving a bitmap with fewer colors is classified as lossy compression
550.010836	553.646412		because the image will lose some of its quality in the process,
553.629659	556.030000		and this loss is irreversible.

558.070000	559.300000		To summarize:
559.360000	563.970000		True color bitmap images encode the color of each pixel separately.
564.520000	568.100000		You can have 4-bit, 8-bit, 16-bit,
568.070000	571.080000		or 24-bit true color images.
571.670000	578.340000		24-bit RGB bitmaps encode the saturation of red, green, and blue channels separately.
579.380000	585.880743		24-bit RGB bitmaps use 8 bits per channel per pixel.
585.810000	587.920000		That's 24 bits per pixel.
589.070000	595.560000		Up to 16.7 million colors are available with 24-bit RGB.
596.620000	600.960000		True color images have relatively large file sizes.
602.500000	607.230000		Indexed color images use a color table known as a palette.
608.490000	614.261698		Data about each pixel is actually a reference to an entry in the palette.
614.850000	623.980000		An adaptive palette contains only those colors needed by the image, and a web-safe palette contains colors that should always look the same.
625.830000	630.210000		Dithering can be used to simulate unavailable colors.
630.830000	635.590000		Indexed color images have relatively small file sizes.
635.690000	642.140000		In fact, saving a true color image as an indexed color image is a type of lossy compression.