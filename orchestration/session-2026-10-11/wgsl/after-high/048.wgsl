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
@binding( 3 ) @group( 1 ) var nodeUniform12_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform12 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform25_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform25 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform3 : f32,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform10 : vec3<f32>,
	nodeUniform11 : f32,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : vec3<f32>,
	nodeUniform36 : vec3<f32>,
	nodeUniform37 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : f32,
	nodeUniform32 : f32,
	nodeUniform16 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform22 : mat4x4<f32>,
	nodeUniform23 : f32,
	nodeUniform24 : f32,
	nodeUniform28 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform26 : f32,
	nodeUniform27 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

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
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : vec2<f32>;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : u32;
var<private> nodeVar44 : u32;
var<private> nodeVar45 : u32;
var<private> nodeVar46 : u32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : u32;
var<private> nodeVar51 : u32;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : u32;
var<private> nodeVar55 : u32;
var<private> nodeVar56 : u32;
var<private> nodeVar57 : u32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar60 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec2<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec4<f32>;
var<private> nodeVar76 : vec4<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec4<f32>;
var<private> nodeVar104 : vec4<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : vec4<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : vec2<f32>;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : vec2<f32>;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : vec2<f32>;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : vec2<f32>;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : vec2<f32>;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : f32;
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
var<private> nodeVar162 : f32;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : f32;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : f32;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : f32;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : f32;
var<private> nodeVar258 : f32;
var<private> nodeVar259 : f32;
var<private> nodeVar260 : f32;
var<private> nodeVar261 : f32;
var<private> nodeVar262 : f32;
var<private> nodeVar263 : f32;
var<private> nodeVar264 : f32;
var<private> nodeVar265 : f32;
var<private> nodeVar266 : f32;
var<private> nodeVar267 : f32;
var<private> nodeVar268 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar270 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar271 : vec3<f32>;
var<private> nodeVar272 : f32;
var<private> nodeVar273 : vec4<f32>;

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
	nodeVar38 = fract( ( vec3<f32>( ( v_positionWorld.x * 1.6 ), ( v_positionWorld.y * 0.22 ), ( v_positionWorld.z * 1.6 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar39 = ( nodeVar38.z * 64.0 );
	nodeVar40 = floor( nodeVar39 );
	nodeVar41 = textureSample( nodeUniform2, nodeUniform2_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar40, 8.0 ), floor( ( nodeVar40 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar38.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar42 = max( 0.1, ( nodeVar12 * 1.5 ) );
	nodeVar43 = ( ( u32( ( nodeVar6 + 55.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar44 = ( ( ( nodeVar43 >> ( ( nodeVar43 >> 28u ) + 4u ) ) ^ nodeVar43 ) * 277803737u );
	nodeVar45 = ( ( u32( ( nodeVar6 + 44.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar46 = ( ( ( nodeVar45 >> ( ( nodeVar45 >> 28u ) + 4u ) ) ^ nodeVar45 ) * 277803737u );
	nodeVar47 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar4 * 0.35 ) ) + ( ( f32( ( ( nodeVar44 >> 22u ) ^ nodeVar44 ) ) * 2.3283064365386963e-10 ) * 13.0 ) ) + ( nodeVar14 * ( ( ( f32( ( ( nodeVar46 >> 22u ) ^ nodeVar46 ) ) * 2.3283064365386963e-10 ) - 0.5 ) * 0.6372 ) ) );
	nodeVar48 = fwidth( nodeVar47 );
	nodeVar49 = max( 0.025, ( nodeVar48 * 0.75 ) );
	nodeVar50 = ( ( u32( ( nodeVar6 + 33.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar51 = ( ( ( nodeVar50 >> ( ( nodeVar50 >> 28u ) + 4u ) ) ^ nodeVar50 ) * 277803737u );
	nodeVar52 = ( ( ( f32( ( ( nodeVar51 >> 22u ) ^ nodeVar51 ) ) * 2.3283064365386963e-10 ) * 2.0 ) + 1.3 );
	nodeVar53 = ( nodeVar47 / nodeVar52 );
	nodeVar54 = ( ( u32( ( nodeVar6 + 66.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar55 = ( ( ( nodeVar54 >> ( ( nodeVar54 >> 28u ) + 4u ) ) ^ nodeVar54 ) * 277803737u );
	nodeVar56 = ( ( u32( ( ( floor( nodeVar53 ) + ( nodeVar6 * 13.0 ) ) + 2000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar57 = ( ( ( nodeVar56 >> ( ( nodeVar56 >> 28u ) + 4u ) ) ^ nodeVar56 ) * 277803737u );
	nodeVar58 = ( ( mix( vec3<f32>( 0.88, 0.94, 1.04 ), vec3<f32>( 1.04, 1.0, 0.92 ), mix( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ), nodeVar11, smoothstep( 0.0, nodeVar13, nodeVar14 ) ) ) * vec3<f32>( max( ( ( ( ( ( ( 0.7 + ( mix( 0.5, ( f32( ( ( nodeVar22 >> 22u ) ^ nodeVar22 ) ) * 2.3283064365386963e-10 ), ( smoothstep( 0.0, nodeVar23, nodeVar25 ) * nodeVar26 ) ) * 0.45 ) ) + ( mix( ( f32( ( ( nodeVar28 >> 22u ) ^ nodeVar28 ) ) * 2.3283064365386963e-10 ), nodeVar17, smoothstep( 0.0, nodeVar13, nodeVar14 ) ) * 0.2 ) ) + ( nodeVar4 * 0.18 ) ) + ( nodeVar33 * 0.1 ) ) - ( ( 1.0 - smoothstep( 0.5, 1.0, ( 1.0 - abs( mix( nodeVar37.x, nodeVar37.y, ( nodeVar35 - nodeVar36 ) ) ) ) ) ) * 0.08 ) ) - ( smoothstep( 0.1, 0.7, mix( nodeVar41.x, nodeVar41.y, ( nodeVar39 - nodeVar40 ) ) ) * 0.2 ) ), 0.12 ) ) ) * vec3<f32>( ( ( ( 1.0 - ( ( 1.0 - ( smoothstep( 0.0, nodeVar42, nodeVar14 ) * smoothstep( 1.0, ( 1.0 - nodeVar42 ), nodeVar14 ) ) ) * 0.35 ) ) * ( 1.0 - ( ( ( ( 1.0 - smoothstep( 0.02, nodeVar23, nodeVar25 ) ) * smoothstep( 0.3, 0.55, nodeVar17 ) ) * nodeVar26 ) * 0.4 ) ) ) * ( 1.0 - ( ( ( ( ( ( 1.0 - smoothstep( ( nodeVar49 - nodeVar48 ), ( nodeVar49 + nodeVar48 ), ( min( fract( nodeVar53 ), ( 1.0 - fract( nodeVar53 ) ) ) * nodeVar52 ) ) ) * min( 1.0, ( 0.05 / ( nodeVar48 * 1.5 ) ) ) ) * ( smoothstep( 0.35, 0.55, ( f32( ( ( nodeVar55 >> 22u ) ^ nodeVar55 ) ) * 2.3283064365386963e-10 ) ) * smoothstep( 0.4, 0.5, ( f32( ( ( nodeVar57 >> 22u ) ^ nodeVar57 ) ) * 2.3283064365386963e-10 ) ) ) ) * nodeVar26 ) * ( 1.0 - smoothstep( ( object.nodeUniform3 * 0.5 ), object.nodeUniform3, length( v_positionView ) ) ) ) * 0.45 ) ) ) ) );
	nodeVar59 = smoothstep( 0.2, 0.55, ( nodeVar4 + ( nodeVar33 * 0.5 ) ) );
	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	DiffuseColor = vec4<f32>( mix( ( vec3<f32>( 0.19, 0.18, 0.17 ) * mix( mix( nodeVar58, ( ( nodeVar58 * vec3<f32>( 0.82, 0.9, 1.0 ) ) * vec3<f32>( 0.82 ) ), ( 0.6 * 0.7 ) ), ( vec3<f32>( 0.82, 0.88, 0.72 ) * vec3<f32>( 0.8 ) ), min( ( ( ( ( ( ( smoothstep( 0.45, 0.75, nodeVar14 ) * smoothstep( 1.0, 0.9, nodeVar14 ) ) * nodeVar59 ) * ( 0.35 + smoothstep( 0.0, 0.5, normalWorld.y ) ) ) * nodeVar26 ) * 0.4 ) + ( ( 0.6 * nodeVar59 ) * 0.12 ) ), 0.45 ) ) ), vec3<f32>( 0.24, 0.215, 0.18 ), ( smoothstep( 0.55, 0.95, normalWorld.y ) * 0.35 ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform7 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform8;
	nodeVar60 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform9, 0.0525 ) + max( max( nodeVar60.x, nodeVar60.y ), nodeVar60.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform8 ) ) );
	EmissiveColor = ( object.nodeUniform10 * vec3<f32>( object.nodeUniform11 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar61 = dot( normalView, positionViewDirection );
	nodeVar62 = textureSample( nodeUniform12, nodeUniform12_sampler, vec2<f32>( Roughness, clamp( nodeVar61, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar62;
	nodeVar63 = ( dfg.x + dfg.y );
	nodeVar64 = ( 1.0 / nodeVar63 );
	nodeVar65 = nodeVar64;
	nodeVar66 = ( nodeVar65 - 1.0 );
	nodeVar67 = ( SpecularColorBlended * vec3<f32>( nodeVar66 ) );
	nodeVar68 = ( nodeVar67 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar68;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar69 = dot( normalWorld, normalize( render.nodeUniform15 ) );
	nodeVar70 = ( nodeVar69 * 0.5 );
	nodeVar71 = ( nodeVar70 + 0.5 );
	nodeVar72 = mix( render.nodeUniform13, render.nodeUniform14, nodeVar71 );
	nodeVar73 = ( irradiance + nodeVar72 );
	irradiance = nodeVar73;
	nodeVar74 = ( render.nodeUniform16 - render.nodeUniform17 );
	nodeVar75 = vec4<f32>( nodeVar74, 0.0 );
	nodeVar76 = ( render.cameraViewMatrix * nodeVar75 );
	nodeVar77 = normalize( nodeVar76.xyz );
	nodeVar78 = nodeVar77;
	nodeVar79 = dot( normalView, nodeVar78 );
	nodeVar80 = ( vec3<f32>( clamp( nodeVar79, 0.0, 1.0 ) ) * render.nodeUniform18 );
	nodeVar81 = nodeVar80;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar82 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar83 = ( nodeVar81 * nodeVar82 );
	nodeVar84 = ( nodeVar78 + positionViewDirection );
	nodeVar85 = normalize( nodeVar84 );
	nodeVar86 = dot( positionViewDirection, nodeVar85 );
	nodeVar87 = clamp( nodeVar86, 0.0, 1.0 );
	nodeVar88 = exp2( ( ( ( nodeVar87 * -5.55473 ) - 6.98316 ) * nodeVar87 ) );
	nodeVar89 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar88 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar88 ) ) );
	nodeVar90 = ( vec3<f32>( 1.0 ) - nodeVar89 );
	nodeVar91 = nodeVar90;
	nodeVar92 = ( nodeVar83 * nodeVar91 );
	nodeVar93 = ( directDiffuse + nodeVar92 );
	directDiffuse = nodeVar93;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar94 = normalize( ( nodeVar78 + positionViewDirection ) );
	nodeVar95 = clamp( dot( positionViewDirection, nodeVar94 ), 0.0, 1.0 );
	nodeVar96 = exp2( ( ( ( nodeVar95 * -5.55473 ) - 6.98316 ) * nodeVar95 ) );
	nodeVar97 = ( Roughness * Roughness );
	nodeVar98 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar96 ) ) ) + vec3<f32>( ( 1.0 * nodeVar96 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar97, clamp( dot( normalView, nodeVar78 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar97, clamp( dot( normalView, nodeVar94 ), 0.0, 1.0 ) ) ) );
	nodeVar99 = ( nodeVar81 * nodeVar98 );
	nodeVar100 = ( nodeVar99 * multiScatteringCompensation );
	nodeVar101 = ( directSpecular + nodeVar100 );
	directSpecular = nodeVar101;
	nodeVar102 = ( render.nodeUniform19 - render.nodeUniform20 );
	nodeVar103 = vec4<f32>( nodeVar102, 0.0 );
	nodeVar104 = ( render.cameraViewMatrix * nodeVar103 );
	nodeVar105 = normalize( nodeVar104.xyz );
	nodeVar106 = nodeVar105;
	nodeVar107 = dot( normalView, nodeVar106 );
	shadowPositionWorld = v_positionWorld;
	nodeVar109 = ( render.nodeUniform22 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform23 ) ) ), 1.0 ) );
	nodeVar110 = ( nodeVar109.xyz / vec3<f32>( nodeVar109.w ) );
	nodeVar111 = vec3<f32>( nodeVar110.x, ( 1.0 - nodeVar110.y ), ( nodeVar110.z + render.nodeUniform24 ) );

	if ( ( ( ( ( ( nodeVar111.x >= 0.0 ) && ( nodeVar111.x <= 1.0 ) ) && ( nodeVar111.y >= 0.0 ) ) && ( nodeVar111.y <= 1.0 ) ) && ( nodeVar111.z <= 1.0 ) ) ) {

		nodeVar112 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar113 = ( render.nodeUniform26 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform27 ).x );
		nodeVar114 = ( nodeVar111.xy + ( vogelDiskSample( 0, 5, nodeVar112 ) * vec2<f32>( nodeVar113 ) ) );
		nodeVar115 = textureSampleCompare( nodeUniform25, nodeUniform25_sampler, nodeVar114, nodeVar111.z );
		nodeVar116 = ( nodeVar111.xy + ( vogelDiskSample( 1, 5, nodeVar112 ) * vec2<f32>( nodeVar113 ) ) );
		nodeVar117 = textureSampleCompare( nodeUniform25, nodeUniform25_sampler, nodeVar116, nodeVar111.z );
		nodeVar118 = ( nodeVar111.xy + ( vogelDiskSample( 2, 5, nodeVar112 ) * vec2<f32>( nodeVar113 ) ) );
		nodeVar119 = textureSampleCompare( nodeUniform25, nodeUniform25_sampler, nodeVar118, nodeVar111.z );
		nodeVar120 = ( nodeVar111.xy + ( vogelDiskSample( 3, 5, nodeVar112 ) * vec2<f32>( nodeVar113 ) ) );
		nodeVar121 = textureSampleCompare( nodeUniform25, nodeUniform25_sampler, nodeVar120, nodeVar111.z );
		nodeVar122 = ( nodeVar111.xy + ( vogelDiskSample( 4, 5, nodeVar112 ) * vec2<f32>( nodeVar113 ) ) );
		nodeVar123 = textureSampleCompare( nodeUniform25, nodeUniform25_sampler, nodeVar122, nodeVar111.z );
		nodeVar108 = ( ( ( ( ( nodeVar115 + nodeVar117 ) + nodeVar119 ) + nodeVar121 ) + nodeVar123 ) * 0.2 );

	} else {

		nodeVar108 = 1.0;

	}

	nodeVar124 = mix( 1.0, nodeVar108, render.nodeUniform28 );
	nodeVar125 = ( vec3<f32>( clamp( nodeVar107, 0.0, 1.0 ) ) * ( render.nodeUniform21 * vec3<f32>( nodeVar124 ) ) );
	nodeVar126 = nodeVar125;
	nodeVar127 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar128 = ( nodeVar126 * nodeVar127 );
	nodeVar129 = ( nodeVar106 + positionViewDirection );
	nodeVar130 = normalize( nodeVar129 );
	nodeVar131 = dot( positionViewDirection, nodeVar130 );
	nodeVar132 = clamp( nodeVar131, 0.0, 1.0 );
	nodeVar133 = exp2( ( ( ( nodeVar132 * -5.55473 ) - 6.98316 ) * nodeVar132 ) );
	nodeVar134 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar133 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar133 ) ) );
	nodeVar135 = ( vec3<f32>( 1.0 ) - nodeVar134 );
	nodeVar136 = nodeVar135;
	nodeVar137 = ( nodeVar128 * nodeVar136 );
	nodeVar138 = ( directDiffuse + nodeVar137 );
	directDiffuse = nodeVar138;
	nodeVar139 = normalize( ( nodeVar106 + positionViewDirection ) );
	nodeVar140 = clamp( dot( positionViewDirection, nodeVar139 ), 0.0, 1.0 );
	nodeVar141 = exp2( ( ( ( nodeVar140 * -5.55473 ) - 6.98316 ) * nodeVar140 ) );
	nodeVar142 = ( Roughness * Roughness );
	nodeVar143 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar141 ) ) ) + vec3<f32>( ( 1.0 * nodeVar141 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar142, clamp( dot( normalView, nodeVar106 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar142, clamp( dot( normalView, nodeVar139 ), 0.0, 1.0 ) ) ) );
	nodeVar144 = ( nodeVar126 * nodeVar143 );
	nodeVar145 = ( nodeVar144 * multiScatteringCompensation );
	nodeVar146 = ( directSpecular + nodeVar145 );
	directSpecular = nodeVar146;
	nodeVar147 = ( render.nodeUniform29 - v_positionView );
	nodeVar148 = normalize( nodeVar147 );
	nodeVar149 = dot( normalView, nodeVar148 );

	if ( ( render.nodeUniform31 > 0.0 ) ) {

		nodeVar151 = length( nodeVar147 );
		nodeVar152 = ( nodeVar151 / render.nodeUniform31 );
		nodeVar153 = clamp( ( 1.0 - ( ( ( nodeVar152 * nodeVar152 ) * nodeVar152 ) * nodeVar152 ) ), 0.0, 1.0 );
		nodeVar150 = ( ( 1.0 / max( pow( nodeVar151, render.nodeUniform32 ), 0.01 ) ) * ( nodeVar153 * nodeVar153 ) );

	} else {

		nodeVar150 = ( 1.0 / max( pow( length( nodeVar147 ), render.nodeUniform32 ), 0.01 ) );

	}

	nodeVar154 = ( render.nodeUniform30 * vec3<f32>( nodeVar150 ) );
	nodeVar155 = ( vec3<f32>( clamp( nodeVar149, 0.0, 1.0 ) ) * nodeVar154 );
	nodeVar156 = nodeVar155;
	nodeVar157 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar158 = ( nodeVar156 * nodeVar157 );
	nodeVar159 = ( nodeVar148 + positionViewDirection );
	nodeVar160 = normalize( nodeVar159 );
	nodeVar161 = dot( positionViewDirection, nodeVar160 );
	nodeVar162 = clamp( nodeVar161, 0.0, 1.0 );
	nodeVar163 = exp2( ( ( ( nodeVar162 * -5.55473 ) - 6.98316 ) * nodeVar162 ) );
	nodeVar164 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar163 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar163 ) ) );
	nodeVar165 = ( vec3<f32>( 1.0 ) - nodeVar164 );
	nodeVar166 = nodeVar165;
	nodeVar167 = ( nodeVar158 * nodeVar166 );
	nodeVar168 = ( directDiffuse + nodeVar167 );
	directDiffuse = nodeVar168;
	nodeVar169 = normalize( ( nodeVar148 + positionViewDirection ) );
	nodeVar170 = clamp( dot( positionViewDirection, nodeVar169 ), 0.0, 1.0 );
	nodeVar171 = exp2( ( ( ( nodeVar170 * -5.55473 ) - 6.98316 ) * nodeVar170 ) );
	nodeVar172 = ( Roughness * Roughness );
	nodeVar173 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar171 ) ) ) + vec3<f32>( ( 1.0 * nodeVar171 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar172, clamp( dot( normalView, nodeVar148 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar172, clamp( dot( normalView, nodeVar169 ), 0.0, 1.0 ) ) ) );
	nodeVar174 = ( nodeVar156 * nodeVar173 );
	nodeVar175 = ( nodeVar174 * multiScatteringCompensation );
	nodeVar176 = ( directSpecular + nodeVar175 );
	directSpecular = nodeVar176;
	nodeVar177 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar178 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar179 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar180 = ( SpecularF90 * dfg.y );
	nodeVar181 = ( nodeVar179 + vec3<f32>( nodeVar180 ) );
	nodeVar182 = ( nodeVar177 + nodeVar181 );
	nodeVar177 = nodeVar182;
	nodeVar183 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar184 = nodeVar183;
	nodeVar185 = ( nodeVar184 * vec3<f32>( 0.047619 ) );
	nodeVar186 = ( SpecularColor + nodeVar185 );
	nodeVar187 = ( nodeVar181 * nodeVar186 );
	nodeVar188 = ( dfg.x + dfg.y );
	nodeVar189 = ( 1.0 - nodeVar188 );
	nodeVar190 = nodeVar189;
	nodeVar191 = ( vec3<f32>( nodeVar190 ) * nodeVar186 );
	nodeVar192 = ( vec3<f32>( 1.0 ) - nodeVar191 );
	nodeVar193 = nodeVar192;
	nodeVar194 = ( nodeVar187 / nodeVar193 );
	nodeVar195 = ( nodeVar194 * vec3<f32>( nodeVar190 ) );
	nodeVar196 = ( nodeVar178 + nodeVar195 );
	nodeVar178 = nodeVar196;
	nodeVar197 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar198 = ( irradiance * nodeVar197 );
	nodeVar199 = ( nodeVar177 + nodeVar178 );
	nodeVar200 = ( vec3<f32>( 1.0 ) - nodeVar199 );
	nodeVar201 = nodeVar200;
	nodeVar202 = ( nodeVar198 * nodeVar201 );
	nodeVar203 = nodeVar202;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar204 = ( indirectDiffuse + nodeVar203 );
	indirectDiffuse = nodeVar204;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar205 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar206 = ( SpecularF90 * dfg.y );
	nodeVar207 = ( nodeVar205 + vec3<f32>( nodeVar206 ) );
	nodeVar208 = ( singleScatteringDielectric + nodeVar207 );
	singleScatteringDielectric = nodeVar208;
	nodeVar209 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar210 = nodeVar209;
	nodeVar211 = ( nodeVar210 * vec3<f32>( 0.047619 ) );
	nodeVar212 = ( SpecularColor + nodeVar211 );
	nodeVar213 = ( nodeVar207 * nodeVar212 );
	nodeVar214 = ( dfg.x + dfg.y );
	nodeVar215 = ( 1.0 - nodeVar214 );
	nodeVar216 = nodeVar215;
	nodeVar217 = ( vec3<f32>( nodeVar216 ) * nodeVar212 );
	nodeVar218 = ( vec3<f32>( 1.0 ) - nodeVar217 );
	nodeVar219 = nodeVar218;
	nodeVar220 = ( nodeVar213 / nodeVar219 );
	nodeVar221 = ( nodeVar220 * vec3<f32>( nodeVar216 ) );
	nodeVar222 = ( multiScatteringDielectric + nodeVar221 );
	multiScatteringDielectric = nodeVar222;
	nodeVar223 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar224 = ( SpecularF90 * dfg.y );
	nodeVar225 = ( nodeVar223 + vec3<f32>( nodeVar224 ) );
	nodeVar226 = ( singleScatteringMetallic + nodeVar225 );
	singleScatteringMetallic = nodeVar226;
	nodeVar227 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar228 = nodeVar227;
	nodeVar229 = ( nodeVar228 * vec3<f32>( 0.047619 ) );
	nodeVar230 = ( DiffuseColor.xyz + nodeVar229 );
	nodeVar231 = ( nodeVar225 * nodeVar230 );
	nodeVar232 = ( dfg.x + dfg.y );
	nodeVar233 = ( 1.0 - nodeVar232 );
	nodeVar234 = nodeVar233;
	nodeVar235 = ( vec3<f32>( nodeVar234 ) * nodeVar230 );
	nodeVar236 = ( vec3<f32>( 1.0 ) - nodeVar235 );
	nodeVar237 = nodeVar236;
	nodeVar238 = ( nodeVar231 / nodeVar237 );
	nodeVar239 = ( nodeVar238 * vec3<f32>( nodeVar234 ) );
	nodeVar240 = ( multiScatteringMetallic + nodeVar239 );
	multiScatteringMetallic = nodeVar240;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar241 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar242 = ( radiance * nodeVar241 );
	nodeVar243 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar244 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar245 = ( nodeVar243 * nodeVar244 );
	nodeVar246 = ( nodeVar242 + nodeVar245 );
	nodeVar247 = nodeVar246;
	nodeVar248 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar249 = ( vec3<f32>( 1.0 ) - nodeVar248 );
	nodeVar250 = nodeVar249;
	nodeVar251 = ( DiffuseContribution * nodeVar250 );
	nodeVar252 = ( nodeVar251 * nodeVar244 );
	nodeVar253 = nodeVar252;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar254 = ( indirectSpecular + nodeVar247 );
	indirectSpecular = nodeVar254;
	nodeVar255 = ( indirectDiffuse + nodeVar253 );
	indirectDiffuse = nodeVar255;
	ambientOcclusion = 1.0;
	nodeVar256 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar256;
	nodeVar257 = dot( normalView, positionViewDirection );
	nodeVar258 = ( clamp( nodeVar257, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar259 = ( Roughness * -16.0 );
	nodeVar260 = ( 1.0 - nodeVar259 );
	nodeVar261 = nodeVar260;
	nodeVar262 = ( - nodeVar261 );
	nodeVar263 = exp2( nodeVar262 );
	nodeVar264 = pow( nodeVar258, nodeVar263 );
	nodeVar265 = ( 1.0 - nodeVar264 );
	nodeVar266 = nodeVar265;
	nodeVar267 = ( ambientOcclusion - nodeVar266 );
	nodeVar268 = ( indirectSpecular * vec3<f32>( clamp( nodeVar267, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar268;
	nodeVar269 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar269;
	nodeVar270 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar270;
	nodeVar271 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar271;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar272 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar273 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform33, object.nodeUniform34, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform36 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform37 * object.nodeUniform37 ) * nodeVar272 ) * nodeVar272 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar273;

	// result

	output.color = nodeVar273;

	return output;

}
