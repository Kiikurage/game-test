// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform2_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform2 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform11_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform11 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform24_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform24 : texture_depth_2d;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : f32,
	nodeUniform31 : f32,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform21 : mat4x4<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : f32,
	nodeUniform27 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform25 : f32,
	nodeUniform26 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : vec3<f32>,
	nodeUniform10 : f32,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform36 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : vec3<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : vec2<f32>;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : u32;
var<private> nodeVar10 : u32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : u32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : u32;
var<private> nodeVar22 : u32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : u32;
var<private> nodeVar28 : u32;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : vec2<f32>;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : vec2<f32>;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar41 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : vec2<f32>;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec4<f32>;
var<private> nodeVar57 : vec4<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec4<f32>;
var<private> nodeVar85 : vec4<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : vec4<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : vec2<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : vec2<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : vec2<f32>;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : vec2<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec2<f32>;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : f32;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : f32;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : f32;
var<private> nodeVar196 : f32;
var<private> nodeVar197 : f32;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : f32;
var<private> nodeVar248 : f32;
var<private> nodeVar249 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : f32;
var<private> nodeVar254 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = fract( ( ( v_positionWorld * vec3<f32>( 0.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar1 = ( nodeVar0.z * 64.0 );
	nodeVar2 = floor( nodeVar1 );
	nodeVar3 = textureSample( nodeUniform2, nodeUniform2_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar2, 8.0 ), floor( ( nodeVar2 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar0.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar4 = mix( nodeVar3.x, nodeVar3.y, ( nodeVar1 - nodeVar2 ) );
	nodeVar5 = ( ( ( ( v_positionWorld.y * 0.85 ) + ( nodeVar4 * 0.7 ) ) + ( v_positionWorld.x * 0.05 ) ) - ( v_positionWorld.z * 0.04 ) );
	nodeVar6 = floor( nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 90.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = ( ( u32( ( nodeVar6 + 91.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar10 = ( ( ( nodeVar9 >> ( ( nodeVar9 >> 28u ) + 4u ) ) ^ nodeVar9 ) * 277803737u );
	nodeVar11 = ( f32( ( ( nodeVar10 >> 22u ) ^ nodeVar10 ) ) * 2.3283064365386963e-10 );
	nodeVar12 = fwidth( nodeVar5 );
	nodeVar13 = min( max( ( nodeVar12 * 1.5 ), 0.16 ), 0.5 );
	nodeVar14 = fract( nodeVar5 );
	nodeVar15 = ( ( u32( ( nodeVar6 + 17.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar16 = ( ( ( nodeVar15 >> ( ( nodeVar15 >> 28u ) + 4u ) ) ^ nodeVar15 ) * 277803737u );
	nodeVar17 = ( f32( ( ( nodeVar16 >> 22u ) ^ nodeVar16 ) ) * 2.3283064365386963e-10 );
	nodeVar18 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar4 * 1.4 ) ) + ( nodeVar17 * 9.0 ) ) + ( ( nodeVar14 * ( nodeVar11 - 0.5 ) ) * 2.4 ) );
	nodeVar19 = ( ( nodeVar11 * 2.6 ) + 2.2 );
	nodeVar20 = ( nodeVar18 / nodeVar19 );
	nodeVar21 = ( ( u32( ( ( floor( nodeVar20 ) + ( nodeVar6 * 31.0 ) ) + 1000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar22 = ( ( ( nodeVar21 >> ( ( nodeVar21 >> 28u ) + 4u ) ) ^ nodeVar21 ) * 277803737u );
	nodeVar23 = max( 0.12, ( fwidth( nodeVar18 ) * 1.5 ) );
	nodeVar24 = fract( nodeVar20 );
	nodeVar25 = ( min( nodeVar24, ( 1.0 - nodeVar24 ) ) * nodeVar19 );
	nodeVar26 = ( smoothstep( 0.0, nodeVar13, nodeVar14 ) * smoothstep( 1.0, ( 1.0 - nodeVar13 ), nodeVar14 ) );
	nodeVar27 = ( ( u32( ( nodeVar6 + 16.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar28 = ( ( ( nodeVar27 >> ( ( nodeVar27 >> 28u ) + 4u ) ) ^ nodeVar27 ) * 277803737u );
	nodeVar29 = fract( ( ( v_positionWorld * vec3<f32>( 5.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar30 = ( nodeVar29.z * 64.0 );
	nodeVar31 = floor( nodeVar30 );
	nodeVar32 = textureSample( nodeUniform2, nodeUniform2_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar31, 8.0 ), floor( ( nodeVar31 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar29.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar33 = mix( nodeVar32.x, nodeVar32.y, ( nodeVar30 - nodeVar31 ) );
	nodeVar34 = fract( ( ( ( v_positionWorld * vec3<f32>( 1.7, 1.0, 1.7 ) ) + vec3<f32>( 7.1, 0.0, 3.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar35 = ( nodeVar34.z * 64.0 );
	nodeVar36 = floor( nodeVar35 );
	nodeVar37 = textureSample( nodeUniform2, nodeUniform2_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar36, 8.0 ), floor( ( nodeVar36 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar34.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar38 = max( 0.1, ( nodeVar12 * 1.5 ) );
	nodeVar39 = ( ( mix( vec3<f32>( 0.88, 0.94, 1.04 ), vec3<f32>( 1.04, 1.0, 0.92 ), mix( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ), nodeVar11, smoothstep( 0.0, nodeVar13, nodeVar14 ) ) ) * vec3<f32>( max( ( ( ( ( ( ( 0.7 + ( mix( 0.5, ( f32( ( ( nodeVar22 >> 22u ) ^ nodeVar22 ) ) * 2.3283064365386963e-10 ), ( smoothstep( 0.0, nodeVar23, nodeVar25 ) * nodeVar26 ) ) * 0.45 ) ) + ( mix( ( f32( ( ( nodeVar28 >> 22u ) ^ nodeVar28 ) ) * 2.3283064365386963e-10 ), nodeVar17, smoothstep( 0.0, nodeVar13, nodeVar14 ) ) * 0.2 ) ) + ( nodeVar4 * 0.18 ) ) + ( nodeVar33 * 0.1 ) ) - ( ( 1.0 - smoothstep( 0.5, 1.0, ( 1.0 - abs( mix( nodeVar37.x, nodeVar37.y, ( nodeVar35 - nodeVar36 ) ) ) ) ) ) * 0.08 ) ) - ( smoothstep( 0.1, 0.7, -1.0 ) * 0.2 ) ), 0.12 ) ) ) * vec3<f32>( ( ( ( 1.0 - ( ( 1.0 - ( smoothstep( 0.0, nodeVar38, nodeVar14 ) * smoothstep( 1.0, ( 1.0 - nodeVar38 ), nodeVar14 ) ) ) * 0.35 ) ) * ( 1.0 - ( ( ( ( 1.0 - smoothstep( 0.02, nodeVar23, nodeVar25 ) ) * smoothstep( 0.3, 0.55, nodeVar17 ) ) * nodeVar26 ) * 0.4 ) ) ) * ( 1.0 - ( 0.0 * 0.45 ) ) ) ) );
	nodeVar40 = smoothstep( 0.2, 0.55, ( nodeVar4 + ( nodeVar33 * 0.5 ) ) );
	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	DiffuseColor = vec4<f32>( mix( ( vec3<f32>( 0.19, 0.18, 0.17 ) * mix( mix( nodeVar39, ( ( nodeVar39 * vec3<f32>( 0.82, 0.9, 1.0 ) ) * vec3<f32>( 0.82 ) ), ( 0.6 * 0.7 ) ), ( vec3<f32>( 0.82, 0.88, 0.72 ) * vec3<f32>( 0.8 ) ), min( ( ( ( ( ( ( smoothstep( 0.45, 0.75, nodeVar14 ) * smoothstep( 1.0, 0.9, nodeVar14 ) ) * nodeVar40 ) * ( 0.35 + smoothstep( 0.0, 0.5, normalWorld.y ) ) ) * nodeVar26 ) * 0.4 ) + ( ( 0.6 * nodeVar40 ) * 0.12 ) ), 0.45 ) ) ), vec3<f32>( 0.24, 0.215, 0.18 ), ( smoothstep( 0.55, 0.95, normalWorld.y ) * 0.35 ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform6 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform7;
	nodeVar41 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform8, 0.0525 ) + max( max( nodeVar41.x, nodeVar41.y ), nodeVar41.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) );
	EmissiveColor = ( object.nodeUniform9 * vec3<f32>( object.nodeUniform10 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar42 = dot( normalView, positionViewDirection );
	nodeVar43 = textureSample( nodeUniform11, nodeUniform11_sampler, vec2<f32>( Roughness, clamp( nodeVar42, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar43;
	nodeVar44 = ( dfg.x + dfg.y );
	nodeVar45 = ( 1.0 / nodeVar44 );
	nodeVar46 = nodeVar45;
	nodeVar47 = ( nodeVar46 - 1.0 );
	nodeVar48 = ( SpecularColorBlended * vec3<f32>( nodeVar47 ) );
	nodeVar49 = ( nodeVar48 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar49;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar50 = dot( normalWorld, normalize( render.nodeUniform14 ) );
	nodeVar51 = ( nodeVar50 * 0.5 );
	nodeVar52 = ( nodeVar51 + 0.5 );
	nodeVar53 = mix( render.nodeUniform12, render.nodeUniform13, nodeVar52 );
	nodeVar54 = ( irradiance + nodeVar53 );
	irradiance = nodeVar54;
	nodeVar55 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar56 = vec4<f32>( nodeVar55, 0.0 );
	nodeVar57 = ( render.cameraViewMatrix * nodeVar56 );
	nodeVar58 = normalize( nodeVar57.xyz );
	nodeVar59 = nodeVar58;
	nodeVar60 = dot( normalView, nodeVar59 );
	nodeVar61 = ( vec3<f32>( clamp( nodeVar60, 0.0, 1.0 ) ) * render.nodeUniform17 );
	nodeVar62 = nodeVar61;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar63 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar64 = ( nodeVar62 * nodeVar63 );
	nodeVar65 = ( nodeVar59 + positionViewDirection );
	nodeVar66 = normalize( nodeVar65 );
	nodeVar67 = dot( positionViewDirection, nodeVar66 );
	nodeVar68 = clamp( nodeVar67, 0.0, 1.0 );
	nodeVar69 = exp2( ( ( ( nodeVar68 * -5.55473 ) - 6.98316 ) * nodeVar68 ) );
	nodeVar70 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar69 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar69 ) ) );
	nodeVar71 = ( vec3<f32>( 1.0 ) - nodeVar70 );
	nodeVar72 = nodeVar71;
	nodeVar73 = ( nodeVar64 * nodeVar72 );
	nodeVar74 = ( directDiffuse + nodeVar73 );
	directDiffuse = nodeVar74;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar75 = normalize( ( nodeVar59 + positionViewDirection ) );
	nodeVar76 = clamp( dot( positionViewDirection, nodeVar75 ), 0.0, 1.0 );
	nodeVar77 = exp2( ( ( ( nodeVar76 * -5.55473 ) - 6.98316 ) * nodeVar76 ) );
	nodeVar78 = ( Roughness * Roughness );
	nodeVar79 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar77 ) ) ) + vec3<f32>( ( 1.0 * nodeVar77 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar78, clamp( dot( normalView, nodeVar59 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar78, clamp( dot( normalView, nodeVar75 ), 0.0, 1.0 ) ) ) );
	nodeVar80 = ( nodeVar62 * nodeVar79 );
	nodeVar81 = ( nodeVar80 * multiScatteringCompensation );
	nodeVar82 = ( directSpecular + nodeVar81 );
	directSpecular = nodeVar82;
	nodeVar83 = ( render.nodeUniform18 - render.nodeUniform19 );
	nodeVar84 = vec4<f32>( nodeVar83, 0.0 );
	nodeVar85 = ( render.cameraViewMatrix * nodeVar84 );
	nodeVar86 = normalize( nodeVar85.xyz );
	nodeVar87 = nodeVar86;
	nodeVar88 = dot( normalView, nodeVar87 );
	shadowPositionWorld = v_positionWorld;
	nodeVar90 = ( render.nodeUniform21 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform22 ) ) ), 1.0 ) );
	nodeVar91 = ( nodeVar90.xyz / vec3<f32>( nodeVar90.w ) );
	nodeVar92 = vec3<f32>( nodeVar91.x, ( 1.0 - nodeVar91.y ), ( nodeVar91.z + render.nodeUniform23 ) );

	if ( ( ( ( ( ( nodeVar92.x >= 0.0 ) && ( nodeVar92.x <= 1.0 ) ) && ( nodeVar92.y >= 0.0 ) ) && ( nodeVar92.y <= 1.0 ) ) && ( nodeVar92.z <= 1.0 ) ) ) {

		nodeVar93 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar94 = ( render.nodeUniform25 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform26 ).x );
		nodeVar95 = ( nodeVar92.xy + ( vogelDiskSample( 0, 5, nodeVar93 ) * vec2<f32>( nodeVar94 ) ) );
		nodeVar96 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar95, nodeVar92.z );
		nodeVar97 = ( nodeVar92.xy + ( vogelDiskSample( 1, 5, nodeVar93 ) * vec2<f32>( nodeVar94 ) ) );
		nodeVar98 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar97, nodeVar92.z );
		nodeVar99 = ( nodeVar92.xy + ( vogelDiskSample( 2, 5, nodeVar93 ) * vec2<f32>( nodeVar94 ) ) );
		nodeVar100 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar99, nodeVar92.z );
		nodeVar101 = ( nodeVar92.xy + ( vogelDiskSample( 3, 5, nodeVar93 ) * vec2<f32>( nodeVar94 ) ) );
		nodeVar102 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar101, nodeVar92.z );
		nodeVar103 = ( nodeVar92.xy + ( vogelDiskSample( 4, 5, nodeVar93 ) * vec2<f32>( nodeVar94 ) ) );
		nodeVar104 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar103, nodeVar92.z );
		nodeVar89 = ( ( ( ( ( nodeVar96 + nodeVar98 ) + nodeVar100 ) + nodeVar102 ) + nodeVar104 ) * 0.2 );

	} else {

		nodeVar89 = 1.0;

	}

	nodeVar105 = mix( 1.0, nodeVar89, render.nodeUniform27 );
	nodeVar106 = ( vec3<f32>( clamp( nodeVar88, 0.0, 1.0 ) ) * ( render.nodeUniform20 * vec3<f32>( nodeVar105 ) ) );
	nodeVar107 = nodeVar106;
	nodeVar108 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar109 = ( nodeVar107 * nodeVar108 );
	nodeVar110 = ( nodeVar87 + positionViewDirection );
	nodeVar111 = normalize( nodeVar110 );
	nodeVar112 = dot( positionViewDirection, nodeVar111 );
	nodeVar113 = clamp( nodeVar112, 0.0, 1.0 );
	nodeVar114 = exp2( ( ( ( nodeVar113 * -5.55473 ) - 6.98316 ) * nodeVar113 ) );
	nodeVar115 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar114 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar114 ) ) );
	nodeVar116 = ( vec3<f32>( 1.0 ) - nodeVar115 );
	nodeVar117 = nodeVar116;
	nodeVar118 = ( nodeVar109 * nodeVar117 );
	nodeVar119 = ( directDiffuse + nodeVar118 );
	directDiffuse = nodeVar119;
	nodeVar120 = normalize( ( nodeVar87 + positionViewDirection ) );
	nodeVar121 = clamp( dot( positionViewDirection, nodeVar120 ), 0.0, 1.0 );
	nodeVar122 = exp2( ( ( ( nodeVar121 * -5.55473 ) - 6.98316 ) * nodeVar121 ) );
	nodeVar123 = ( Roughness * Roughness );
	nodeVar124 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar122 ) ) ) + vec3<f32>( ( 1.0 * nodeVar122 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar123, clamp( dot( normalView, nodeVar87 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar123, clamp( dot( normalView, nodeVar120 ), 0.0, 1.0 ) ) ) );
	nodeVar125 = ( nodeVar107 * nodeVar124 );
	nodeVar126 = ( nodeVar125 * multiScatteringCompensation );
	nodeVar127 = ( directSpecular + nodeVar126 );
	directSpecular = nodeVar127;
	nodeVar128 = ( render.nodeUniform28 - v_positionView );
	nodeVar129 = normalize( nodeVar128 );
	nodeVar130 = dot( normalView, nodeVar129 );

	if ( ( render.nodeUniform30 > 0.0 ) ) {

		nodeVar132 = length( nodeVar128 );
		nodeVar133 = ( nodeVar132 / render.nodeUniform30 );
		nodeVar134 = clamp( ( 1.0 - ( ( ( nodeVar133 * nodeVar133 ) * nodeVar133 ) * nodeVar133 ) ), 0.0, 1.0 );
		nodeVar131 = ( ( 1.0 / max( pow( nodeVar132, render.nodeUniform31 ), 0.01 ) ) * ( nodeVar134 * nodeVar134 ) );

	} else {

		nodeVar131 = ( 1.0 / max( pow( length( nodeVar128 ), render.nodeUniform31 ), 0.01 ) );

	}

	nodeVar135 = ( render.nodeUniform29 * vec3<f32>( nodeVar131 ) );
	nodeVar136 = ( vec3<f32>( clamp( nodeVar130, 0.0, 1.0 ) ) * nodeVar135 );
	nodeVar137 = nodeVar136;
	nodeVar138 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar139 = ( nodeVar137 * nodeVar138 );
	nodeVar140 = ( nodeVar129 + positionViewDirection );
	nodeVar141 = normalize( nodeVar140 );
	nodeVar142 = dot( positionViewDirection, nodeVar141 );
	nodeVar143 = clamp( nodeVar142, 0.0, 1.0 );
	nodeVar144 = exp2( ( ( ( nodeVar143 * -5.55473 ) - 6.98316 ) * nodeVar143 ) );
	nodeVar145 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar144 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar144 ) ) );
	nodeVar146 = ( vec3<f32>( 1.0 ) - nodeVar145 );
	nodeVar147 = nodeVar146;
	nodeVar148 = ( nodeVar139 * nodeVar147 );
	nodeVar149 = ( directDiffuse + nodeVar148 );
	directDiffuse = nodeVar149;
	nodeVar150 = normalize( ( nodeVar129 + positionViewDirection ) );
	nodeVar151 = clamp( dot( positionViewDirection, nodeVar150 ), 0.0, 1.0 );
	nodeVar152 = exp2( ( ( ( nodeVar151 * -5.55473 ) - 6.98316 ) * nodeVar151 ) );
	nodeVar153 = ( Roughness * Roughness );
	nodeVar154 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar152 ) ) ) + vec3<f32>( ( 1.0 * nodeVar152 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar153, clamp( dot( normalView, nodeVar129 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar153, clamp( dot( normalView, nodeVar150 ), 0.0, 1.0 ) ) ) );
	nodeVar155 = ( nodeVar137 * nodeVar154 );
	nodeVar156 = ( nodeVar155 * multiScatteringCompensation );
	nodeVar157 = ( directSpecular + nodeVar156 );
	directSpecular = nodeVar157;
	nodeVar158 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar159 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar160 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar161 = ( SpecularF90 * dfg.y );
	nodeVar162 = ( nodeVar160 + vec3<f32>( nodeVar161 ) );
	nodeVar163 = ( nodeVar158 + nodeVar162 );
	nodeVar158 = nodeVar163;
	nodeVar164 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar165 = nodeVar164;
	nodeVar166 = ( nodeVar165 * vec3<f32>( 0.047619 ) );
	nodeVar167 = ( SpecularColor + nodeVar166 );
	nodeVar168 = ( nodeVar162 * nodeVar167 );
	nodeVar169 = ( dfg.x + dfg.y );
	nodeVar170 = ( 1.0 - nodeVar169 );
	nodeVar171 = nodeVar170;
	nodeVar172 = ( vec3<f32>( nodeVar171 ) * nodeVar167 );
	nodeVar173 = ( vec3<f32>( 1.0 ) - nodeVar172 );
	nodeVar174 = nodeVar173;
	nodeVar175 = ( nodeVar168 / nodeVar174 );
	nodeVar176 = ( nodeVar175 * vec3<f32>( nodeVar171 ) );
	nodeVar177 = ( nodeVar159 + nodeVar176 );
	nodeVar159 = nodeVar177;
	nodeVar178 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar179 = ( irradiance * nodeVar178 );
	nodeVar180 = ( nodeVar158 + nodeVar159 );
	nodeVar181 = ( vec3<f32>( 1.0 ) - nodeVar180 );
	nodeVar182 = nodeVar181;
	nodeVar183 = ( nodeVar179 * nodeVar182 );
	nodeVar184 = nodeVar183;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar185 = ( indirectDiffuse + nodeVar184 );
	indirectDiffuse = nodeVar185;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar186 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar187 = ( SpecularF90 * dfg.y );
	nodeVar188 = ( nodeVar186 + vec3<f32>( nodeVar187 ) );
	nodeVar189 = ( singleScatteringDielectric + nodeVar188 );
	singleScatteringDielectric = nodeVar189;
	nodeVar190 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar191 = nodeVar190;
	nodeVar192 = ( nodeVar191 * vec3<f32>( 0.047619 ) );
	nodeVar193 = ( SpecularColor + nodeVar192 );
	nodeVar194 = ( nodeVar188 * nodeVar193 );
	nodeVar195 = ( dfg.x + dfg.y );
	nodeVar196 = ( 1.0 - nodeVar195 );
	nodeVar197 = nodeVar196;
	nodeVar198 = ( vec3<f32>( nodeVar197 ) * nodeVar193 );
	nodeVar199 = ( vec3<f32>( 1.0 ) - nodeVar198 );
	nodeVar200 = nodeVar199;
	nodeVar201 = ( nodeVar194 / nodeVar200 );
	nodeVar202 = ( nodeVar201 * vec3<f32>( nodeVar197 ) );
	nodeVar203 = ( multiScatteringDielectric + nodeVar202 );
	multiScatteringDielectric = nodeVar203;
	nodeVar204 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar205 = ( SpecularF90 * dfg.y );
	nodeVar206 = ( nodeVar204 + vec3<f32>( nodeVar205 ) );
	nodeVar207 = ( singleScatteringMetallic + nodeVar206 );
	singleScatteringMetallic = nodeVar207;
	nodeVar208 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar209 = nodeVar208;
	nodeVar210 = ( nodeVar209 * vec3<f32>( 0.047619 ) );
	nodeVar211 = ( DiffuseColor.xyz + nodeVar210 );
	nodeVar212 = ( nodeVar206 * nodeVar211 );
	nodeVar213 = ( dfg.x + dfg.y );
	nodeVar214 = ( 1.0 - nodeVar213 );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( vec3<f32>( nodeVar215 ) * nodeVar211 );
	nodeVar217 = ( vec3<f32>( 1.0 ) - nodeVar216 );
	nodeVar218 = nodeVar217;
	nodeVar219 = ( nodeVar212 / nodeVar218 );
	nodeVar220 = ( nodeVar219 * vec3<f32>( nodeVar215 ) );
	nodeVar221 = ( multiScatteringMetallic + nodeVar220 );
	multiScatteringMetallic = nodeVar221;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar222 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar223 = ( radiance * nodeVar222 );
	nodeVar224 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar225 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar226 = ( nodeVar224 * nodeVar225 );
	nodeVar227 = ( nodeVar223 + nodeVar226 );
	nodeVar228 = nodeVar227;
	nodeVar229 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar230 = ( vec3<f32>( 1.0 ) - nodeVar229 );
	nodeVar231 = nodeVar230;
	nodeVar232 = ( DiffuseContribution * nodeVar231 );
	nodeVar233 = ( nodeVar232 * nodeVar225 );
	nodeVar234 = nodeVar233;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar235 = ( indirectSpecular + nodeVar228 );
	indirectSpecular = nodeVar235;
	nodeVar236 = ( indirectDiffuse + nodeVar234 );
	indirectDiffuse = nodeVar236;
	ambientOcclusion = 1.0;
	nodeVar237 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar237;
	nodeVar238 = dot( normalView, positionViewDirection );
	nodeVar239 = ( clamp( nodeVar238, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar240 = ( Roughness * -16.0 );
	nodeVar241 = ( 1.0 - nodeVar240 );
	nodeVar242 = nodeVar241;
	nodeVar243 = ( - nodeVar242 );
	nodeVar244 = exp2( nodeVar243 );
	nodeVar245 = pow( nodeVar239, nodeVar244 );
	nodeVar246 = ( 1.0 - nodeVar245 );
	nodeVar247 = nodeVar246;
	nodeVar248 = ( ambientOcclusion - nodeVar247 );
	nodeVar249 = ( indirectSpecular * vec3<f32>( clamp( nodeVar248, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar249;
	nodeVar250 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar250;
	nodeVar251 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar251;
	nodeVar252 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar252;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar253 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar254 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform32, object.nodeUniform33, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform35 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform36 * object.nodeUniform36 ) * nodeVar253 ) * nodeVar253 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar254;

	// result

	output.color = nodeVar254;

	return output;

}
